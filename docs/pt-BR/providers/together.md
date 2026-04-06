---
read_when:
    - Você quer usar o Together AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de auth na CLI
summary: Configuração do Together AI (auth + seleção de model)
title: Together AI
x-i18n:
    generated_at: "2026-04-06T03:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b68fdc15bfcac8d59e3e0c06a39162abd48d9d41a9a64a0ac622cd8e3f80a595
    source_path: providers/together.md
    workflow: 15
---

# Together AI

O [Together AI](https://together.ai) fornece acesso aos principais models open-source, incluindo Llama, DeepSeek, Kimi e outros, por meio de uma API unificada.

- Provedor: `together`
- Auth: `TOGETHER_API_KEY`
- API: compatível com OpenAI
- Base URL: `https://api.together.xyz/v1`

## Início rápido

1. Defina a chave de API (recomendado: armazene-a para o Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Defina um model padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Isso definirá `together/moonshotai/Kimi-K2.5` como o model padrão.

## Observação sobre ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), verifique se `TOGETHER_API_KEY`
está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Catálogo integrado

Atualmente, o OpenClaw inclui este catálogo integrado do Together:

| Ref de model                                                    | Nome                                   | Entrada     | Contexto   | Observações                      |
| --------------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                                 | Kimi K2.5                              | texto, imagem | 262,144  | Model padrão; reasoning ativado |
| `together/zai-org/GLM-4.7`                                      | GLM 4.7 Fp8                            | texto       | 202,752    | Model de texto de uso geral      |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`              | Llama 3.3 70B Instruct Turbo           | texto       | 131,072    | Model de instrução rápido        |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`            | Llama 4 Scout 17B 16E Instruct         | texto, imagem | 10,000,000 | Multimodal                    |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`    | Llama 4 Maverick 17B 128E Instruct FP8 | texto, imagem | 20,000,000 | Multimodal                    |
| `together/deepseek-ai/DeepSeek-V3.1`                            | DeepSeek V3.1                          | texto       | 131,072    | Model de texto geral             |
| `together/deepseek-ai/DeepSeek-R1`                              | DeepSeek R1                            | texto       | 131,072    | Model de reasoning               |
| `together/moonshotai/Kimi-K2-Instruct-0905`                     | Kimi K2-Instruct 0905                  | texto       | 262,144    | Model de texto Kimi secundário   |

A predefinição de onboarding define `together/moonshotai/Kimi-K2.5` como model padrão.

## Geração de vídeo

O plugin integrado `together` também registra geração de vídeo por meio da
tool compartilhada `video_generate`.

- Model de vídeo padrão: `together/Wan-AI/Wan2.2-T2V-A14B`
- Modos: fluxos de texto para vídeo e de imagem única de referência
- Suporta `aspectRatio` e `resolution`

Para usar o Together como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

Consulte [Video Generation](/tools/video-generation) para ver os parâmetros
compartilhados da tool, a seleção de provedor e o comportamento de failover.
