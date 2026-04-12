---
read_when:
    - Você quer usar o Together AI com o OpenClaw
    - Você precisa da variável de ambiente da chave da API ou da opção de autenticação da CLI
summary: Configuração do Together AI (autenticação + seleção de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-04-12T23:32:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) fornece acesso aos principais modelos open source,
incluindo Llama, DeepSeek, Kimi e outros, por meio de uma API unificada.

| Propriedade | Valor                        |
| ----------- | ---------------------------- |
| Provedor    | `together`                   |
| Autenticação | `TOGETHER_API_KEY`          |
| API         | Compatível com OpenAI        |
| URL base    | `https://api.together.xyz/v1` |

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
O preset de onboarding define `together/moonshotai/Kimi-K2.5` como modelo
padrão.
</Note>

## Catálogo integrado

O OpenClaw inclui este catálogo Together integrado:

| Referência do modelo                                        | Nome                                   | Entrada     | Contexto   | Observações                     |
| ----------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | ------------------------------- |
| `together/moonshotai/Kimi-K2.5`                             | Kimi K2.5                              | text, image | 262,144    | Modelo padrão; raciocínio habilitado |
| `together/zai-org/GLM-4.7`                                  | GLM 4.7 Fp8                            | text        | 202,752    | Modelo de texto de uso geral    |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`          | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Modelo de instrução rápido      |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`        | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodal                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodal                      |
| `together/deepseek-ai/DeepSeek-V3.1`                        | DeepSeek V3.1                          | text        | 131,072    | Modelo geral de texto           |
| `together/deepseek-ai/DeepSeek-R1`                          | DeepSeek R1                            | text        | 131,072    | Modelo de raciocínio            |
| `together/moonshotai/Kimi-K2-Instruct-0905`                 | Kimi K2-Instruct 0905                  | text        | 262,144    | Modelo de texto Kimi secundário |

## Geração de vídeo

O plugin `together` integrado também registra geração de vídeo por meio da
ferramenta compartilhada `video_generate`.

| Propriedade           | Valor                                 |
| --------------------- | ------------------------------------- |
| Modelo de vídeo padrão | `together/Wan-AI/Wan2.2-T2V-A14B`    |
| Modos                 | texto para vídeo, referência de imagem única |
| Parâmetros compatíveis | `aspectRatio`, `resolution`          |

Para usar Together como provedor de vídeo padrão:

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
Veja [Geração de vídeo](/pt-BR/tools/video-generation) para os parâmetros compartilhados da ferramenta,
seleção de provedor e comportamento de failover.
</Tip>

<AccordionGroup>
  <Accordion title="Observação sobre variável de ambiente">
    Se o Gateway for executado como um daemon (launchd/systemd), certifique-se de que
    `TOGETHER_API_KEY` esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para
    processos do Gateway gerenciados por daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Verifique se sua chave funciona: `openclaw models list --provider together`
    - Se os modelos não estiverem aparecendo, confirme que a chave da API está definida no ambiente
      correto para o processo do seu Gateway.
    - As referências de modelo usam o formato `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de geração de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Schema completo de configuração, incluindo configurações de provedores.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Painel do Together AI, documentação da API e preços.
  </Card>
</CardGroup>
