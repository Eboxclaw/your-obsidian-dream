# assets/models/

ONNX embedding model files go here. They are bundled into the APK.
LFM2 model files are NOT bundled - they are downloaded at onboarding via the plugin.

## Required files (download before build)

- all-MiniLM-L6-v2.onnx       22MB  - from HuggingFace: sentence-transformers/all-MiniLM-L6-v2
- tokenizer.json                       - from same HuggingFace repo
- special_tokens_map.json              - from same HuggingFace repo

## Download command

```bash
pip install huggingface_hub
python -c "
from huggingface_hub import snapshot_download
snapshot_download(
  repo_id='sentence-transformers/all-MiniLM-L6-v2',
  local_dir='assets/models',
  allow_patterns=['*.onnx', 'tokenizer.json', 'special_tokens_map.json']
)
"
```

## NOT bundled (downloaded at onboarding)

- LFM2-350M-Extract.gguf      ~350MB  - via invoke('plugin:leap-ai|download_model')
- LFM2-1.2B-Extract.gguf      ~1.2GB  - Phase 2+ upgrade path

Never commit .gguf or .onnx files to git. They are in .gitignore.
