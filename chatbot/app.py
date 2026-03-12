import os
import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
from fastapi.responses import JSONResponse
from typing import List

HF_TOKEN = os.environ.get("HF_TOKEN")
REPO_ID  = "defectGI/defectgi"
MAX_HISTORY_TOKENS = 2000

app = FastAPI()

print("Model yukleniyor...")

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)

tokenizer = AutoTokenizer.from_pretrained(REPO_ID, token=HF_TOKEN)
tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    "mistralai/Mistral-7B-v0.1",
    quantization_config=bnb_config,
    device_map="auto",
)
model = PeftModel.from_pretrained(model, REPO_ID, token=HF_TOKEN)
model.eval()

print("Model hazir!")


class Message(BaseModel):
    role: str      # "user" | "assistant"
    content: str


class Request(BaseModel):
    messages: List[Message]
    max_tokens: int = 200


def estimate_tokens(text: str) -> int:
    """Kaba token tahmini: her 4 karakter ~1 token."""
    return max(1, len(text) // 4)


def sliding_window(messages: List[Message], max_tokens: int = MAX_HISTORY_TOKENS) -> List[Message]:
    """
    Mesaj listesini sondan başa tarayarak max_tokens sınırına kadar tutar.
    Son mesaj (mevcut kullanıcı sorusu) her zaman korunur.
    """
    kept = []
    total = 0
    for msg in reversed(messages):
        cost = estimate_tokens(msg.content)
        if total + cost > max_tokens and kept:
            break
        kept.insert(0, msg)
        total += cost
    return kept


def build_mistral_prompt(messages: List[Message]) -> str:
    """
    Mistral instruction formatı:
    <s>[INST] user [/INST] assistant </s>[INST] user [/INST]
    """
    prompt = "<s>"
    for msg in messages:
        if msg.role == "user":
            prompt += f"[INST] {msg.content} [/INST] "
        elif msg.role == "assistant":
            prompt += f"{msg.content} </s>"
    return prompt


@app.post("/predict")
def predict(req: Request):
    windowed = sliding_window(req.messages)
    prompt = build_mistral_prompt(windowed)

    inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=req.max_tokens,
            do_sample=True,
            temperature=0.7,
            repetition_penalty=1.1,
            pad_token_id=tokenizer.eos_token_id
        )
    generated = out[0][inputs["input_ids"].shape[1]:]
    text = tokenizer.decode(generated, skip_special_tokens=True).strip()

    return JSONResponse(
        content={"response": text},
        media_type="application/json; charset=utf-8"
    )


@app.get("/")
def root():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
