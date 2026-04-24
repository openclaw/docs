---
read_when:
    - Você quer usar Together AI com OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Together AI (autenticação + seleção de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-04-24T06:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

[Together AI](https://together.ai) fornece acesso aos principais modelos
open-source, incluindo Llama, DeepSeek, Kimi e outros, por meio de uma API unificada.

| Property | Value                         |
| -------- | ----------------------------- |
| Provider | `together`                    |
| Auth     | `TOGETHER_API_KEY`            |
| API      | Compatível com OpenAI         |
| Base URL | `https://api.together.xyz/v1` |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma chave de API em
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Defina um modelo padrão">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
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
O preset de onboarding define `together/moonshotai/Kimi-K2.5` como o modelo
padrão.
</Note>

## Catálogo incluído

O OpenClaw inclui este catálogo Together:

| Model ref                                                    | Name                                   | Input       | Context    | Notes                                 |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | ------------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | Modelo padrão; raciocínio ativado     |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | Modelo de texto de propósito geral    |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Modelo rápido de instrução            |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodal                            |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodal                            |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | Modelo de texto geral                 |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | Modelo de raciocínio                  |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | Modelo de texto Kimi secundário       |

## Geração de vídeo

O Plugin `together` incluído também registra geração de vídeo por meio da
ferramenta compartilhada `video_generate`.

| Property             | Value                                 |
| -------------------- | ------------------------------------- |
| Modelo padrão de vídeo | `together/Wan-AI/Wan2.2-T2V-A14B`   |
| Modes                | texto para vídeo, referência de imagem única |
| Parâmetros compatíveis | `aspectRatio`, `resolution`         |

Para usar Together como provedor padrão de vídeo:

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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver os parâmetros compartilhados da ferramenta,
seleção de provedor e comportamento de failover.
</Tip>

<AccordionGroup>
  <Accordion title="Observação sobre ambiente">
    Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que
    `TOGETHER_API_KEY` esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para
    processos de gateway gerenciados por daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Verifique se sua chave funciona: `openclaw models list --provider together`
    - Se os modelos não estiverem aparecendo, confirme que a chave de API está definida no ambiente correto para o processo do Gateway.
    - Refs de modelo usam o formato `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedor, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de geração de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Schema completo de configuração, incluindo definições de provedor.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dashboard do Together AI, documentação da API e preços.
  </Card>
</CardGroup>
