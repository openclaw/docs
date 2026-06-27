---
read_when:
    - Você quer usar o Together AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da escolha de autenticação da CLI
summary: Configuração da Together AI (autenticação + seleção de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:06:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) fornece acesso aos principais modelos de código aberto, incluindo Llama, DeepSeek, Kimi e outros, por meio de uma API unificada.

| Propriedade | Valor                         |
| -------- | ----------------------------- |
| Provedor | `together`                    |
| Autenticação     | `TOGETHER_API_KEY`            |
| API      | Compatível com OpenAI             |
| URL base | `https://api.together.xyz/v1` |

## Introdução

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
A predefinição de onboarding define
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` como o modelo padrão.
</Note>

## Catálogo integrado

O OpenClaw inclui este catálogo Together integrado:

| Ref. do modelo                                          | Nome                         | Entrada       | Contexto | Observações                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texto        | 131,072 | Modelo padrão        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texto, imagem | 262,144 | Modelo de raciocínio Kimi |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texto        | 512,000 | Modelo de texto de raciocínio |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texto        | 32,768  | Modelo de texto rápido      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texto        | 202,752 | Modelo de texto de raciocínio |

## Geração de vídeo

O Plugin `together` integrado também registra a geração de vídeo por meio da ferramenta compartilhada `video_generate`.

| Propriedade             | Valor                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Modelo de vídeo padrão  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| Modos                | texto para vídeo; referência de imagem única apenas com `Wan-AI/Wan2.2-I2V-A14B` |
| Parâmetros compatíveis | `aspectRatio`, `resolution`                                              |

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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver os parâmetros da ferramenta compartilhada, a seleção de provedor e o comportamento de failover.
</Tip>

<AccordionGroup>
  <Accordion title="Observação sobre ambiente">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se
    `TOGETHER_API_KEY` está disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos de Gateway gerenciados por daemon. Use a configuração `~/.openclaw/.env` ou `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Verifique se sua chave funciona: `openclaw models list --provider together`
    - Se os modelos não estiverem aparecendo, confirme se a chave de API está definida no ambiente correto para o processo do Gateway.
    - As refs. de modelo usam o formato `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedor, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros da ferramenta compartilhada de geração de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo configurações de provedor.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Painel da Together AI, documentação da API e preços.
  </Card>
</CardGroup>
