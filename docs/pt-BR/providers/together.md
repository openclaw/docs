---
read_when:
    - Você quer usar o Together AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Together AI (autenticação + seleção de modelo)
title: Together AI
x-i18n:
    generated_at: "2026-04-30T10:06:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) fornece acesso a modelos open-source líderes, incluindo Llama, DeepSeek, Kimi e outros, por meio de uma API unificada.

| Propriedade | Valor                         |
| -------- | ----------------------------- |
| Provedor | `together`                    |
| Autenticação | `TOGETHER_API_KEY`            |
| API      | compatível com OpenAI             |
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
A predefinição de onboarding define `together/moonshotai/Kimi-K2.5` como o modelo padrão.
</Note>

## Catálogo integrado

O OpenClaw inclui este catálogo Together integrado:

| Ref. do modelo                                             | Nome                                   | Entrada       | Contexto   | Observações                      |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | texto, imagem | 262,144    | Modelo padrão; raciocínio habilitado |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | texto        | 202,752    | Modelo de texto de uso geral       |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | texto        | 131,072    | Modelo rápido para instruções           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | texto, imagem | 10,000,000 | Multimodal                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | texto, imagem | 20,000,000 | Multimodal                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | texto        | 131,072    | Modelo de texto geral               |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | texto        | 131,072    | Modelo de raciocínio                  |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | texto        | 262,144    | Modelo de texto Kimi secundário        |

## Geração de vídeo

O Plugin `together` integrado também registra geração de vídeo por meio da ferramenta compartilhada `video_generate`.

| Propriedade          | Valor                                 |
| -------------------- | ------------------------------------- |
| Modelo de vídeo padrão | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Modos                | texto para vídeo, referência de imagem única |
| Parâmetros compatíveis | `aspectRatio`, `resolution`           |

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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver os parâmetros compartilhados da ferramenta, a seleção de provedor e o comportamento de failover.
</Tip>

<AccordionGroup>
  <Accordion title="Observação sobre o ambiente">
    Se o Gateway for executado como um daemon (launchd/systemd), garanta que
    `TOGETHER_API_KEY` esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos de gateway gerenciados por daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para disponibilidade persistente.
    </Warning>

  </Accordion>

  <Accordion title="Solução de problemas">
    - Verifique se sua chave funciona: `openclaw models list --provider together`
    - Se os modelos não aparecerem, confirme que a chave de API está definida no ambiente correto para o processo do seu Gateway.
    - Refs. de modelo usam o formato `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedor, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros da ferramenta compartilhada de geração de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema de configuração completo, incluindo configurações de provedor.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Painel do Together AI, documentação da API e preços.
  </Card>
</CardGroup>
