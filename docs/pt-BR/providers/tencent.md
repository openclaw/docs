---
read_when:
    - Você quer usar a prévia do Tencent Hy3 com o OpenClaw
    - Você precisa da configuração da chave de API do TokenHub
summary: Configuração do Tencent Cloud TokenHub para prévia do Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:09:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

O Tencent Cloud é fornecido como um **Plugin de provider incluído** no OpenClaw. Ele dá acesso à prévia do Tencent Hy3 pelo endpoint TokenHub (`tencent-tokenhub`).

O provider usa uma API compatível com OpenAI.

| Propriedade   | Valor                                      |
| ------------- | ------------------------------------------ |
| Provider      | `tencent-tokenhub`                         |
| Modelo padrão | `tencent-tokenhub/hy3-preview`             |
| Autenticação  | `TOKENHUB_API_KEY`                         |
| API           | chat completions compatível com OpenAI     |
| Base URL      | `https://tokenhub.tencentmaas.com/v1`      |
| URL global    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Início rápido

<Steps>
  <Step title="Criar uma chave de API do TokenHub">
    Crie uma chave de API no Tencent Cloud TokenHub. Se você escolher um escopo de acesso limitado para a chave, inclua **Hy3 preview** nos modelos permitidos.
  </Step>
  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Verificar o modelo">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Configuração não interativa

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref de modelo                  | Nome                   | Entrada | Contexto | Saída máxima | Observações                 |
| ------------------------------ | ---------------------- | ------- | -------- | ------------ | --------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text    | 256,000  | 64,000       | Padrão; raciocínio habilitado |

Hy3 preview é o grande modelo de linguagem MoE da Tencent Hunyuan para raciocínio, seguimento de instruções com contexto longo, código e fluxos de trabalho de agentes. Os exemplos compatíveis com OpenAI da Tencent usam `hy3-preview` como ID do modelo e oferecem suporte a chamadas de ferramenta padrão de chat-completions além de `reasoning_effort`.

<Tip>
O ID do modelo é `hy3-preview`. Não o confunda com os modelos `HY-3D-*` da Tencent, que são APIs de geração 3D e não são o modelo de chat do OpenClaw configurado por este provider.
</Tip>

## Substituição de endpoint

O OpenClaw usa por padrão o endpoint `https://tokenhub.tencentmaas.com/v1` do Tencent Cloud. A Tencent também documenta um endpoint internacional do TokenHub:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Substitua o endpoint somente quando sua conta ou região do TokenHub exigir isso.

## Observações

- As refs de modelo do TokenHub usam `tencent-tokenhub/<modelId>`.
- O catálogo incluído atualmente contém `hy3-preview`.
- O Plugin marca o Hy3 preview como compatível com raciocínio e com uso de streaming.
- O Plugin é fornecido com metadados de preços em camadas do Hy3, então estimativas de custo são preenchidas sem substituições manuais de preços.
- Substitua preços, contexto ou metadados de endpoint em `models.providers` somente quando necessário.

## Observação sobre ambiente

Se o Gateway estiver sendo executado como daemon (launchd/systemd), certifique-se de que `TOKENHUB_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Documentação relacionada

- [Configuração do OpenClaw](/pt-BR/gateway/configuration)
- [Providers de modelo](/pt-BR/concepts/model-providers)
- [Página do produto Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Geração de texto Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Configuração do Tencent TokenHub Cline para Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Cartão do modelo Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
