---
read_when:
    - Você quer usar o Together AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Together AI (autenticação + seleção de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T00:20:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) fornece acesso aos principais modelos de código aberto,
incluindo Llama, DeepSeek, Kimi e outros, por meio de uma API unificada.
O OpenClaw o inclui como o provedor `together`.

| Propriedade | Valor                         |
| -------- | ----------------------------- |
| Provedor | `together`                    |
| Autenticação | `TOGETHER_API_KEY`            |
| API      | Compatível com OpenAI         |
| URL base | `https://api.together.xyz/v1` |

## Primeiros passos

<Steps>
  <Step title="Get an API key">
    Crie uma chave de API em
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
A integração inicial define `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` como o
modelo padrão.
</Note>

## Catálogo integrado

O custo é em USD por milhão de tokens.

| Referência do modelo                                | Nome                         | Entrada        | Contexto | Saída máxima | Custo (entrada/saída) | Observações             |
| -------------------------------------------------- | ---------------------------- | -------------- | -------- | ------------ | --------------------- | ----------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texto          | 131,072  | 8,192        | 0.88 / 0.88           | Modelo padrão           |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texto, imagem  | 262,144  | 32,768       | 1.20 / 4.50           | Modelo de raciocínio    |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texto          | 512,000  | 8,192        | 2.10 / 4.40           | Modelo de raciocínio    |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texto          | 32,768   | 8,192        | 0.30 / 0.30           | Rápido, sem raciocínio  |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texto          | 202,752  | 8,192        | 1.40 / 4.40           | Modelo de raciocínio    |

## Geração de vídeo

O plugin `together` incluído também registra a geração de vídeo por meio da
ferramenta compartilhada `video_generate`.

| Propriedade              | Valor                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Modelo de vídeo padrão   | `Wan-AI/Wan2.2-T2V-A14B`                                                                                  |
| Outros modelos           | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                                    |
| Modos                    | texto para vídeo; imagem para vídeo somente com `Wan-AI/Wan2.2-I2V-A14B` (uma única imagem de referência) |
| Duração                  | 1 a 10 segundos                                                                                           |
| Parâmetros compatíveis   | `size` (interpretado como `<width>x<height>`); `aspectRatio`/`resolution` não são lidos                    |

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

<Tip>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver os parâmetros da ferramenta compartilhada,
a seleção de provedor e o comportamento de failover.
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se
    `TOGETHER_API_KEY` está disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou por meio de `env.shellEnv`).

    <Warning>
    As chaves definidas somente no shell interativo não ficam visíveis para os
    processos do Gateway gerenciados por daemon. Use a configuração `~/.openclaw/.env`
    ou `env.shellEnv` para garantir disponibilidade persistente.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Verifique se sua chave funciona: `openclaw models list --provider together`
    - Se os modelos não aparecerem, confirme se a chave de API está definida no
      ambiente correto para o processo do Gateway.
    - As referências de modelo usam o formato `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model providers" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Video generation" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros da ferramenta compartilhada de geração de vídeo e seleção de provedor.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo as configurações dos provedores.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Painel, documentação da API e preços do Together AI.
  </Card>
</CardGroup>
