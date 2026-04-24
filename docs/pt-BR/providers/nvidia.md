---
read_when:
    - Você quer usar modelos abertos no OpenClaw gratuitamente
    - Você precisa configurar `NVIDIA_API_KEY`
summary: Usar a API compatível com OpenAI da NVIDIA no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T06:08:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

A NVIDIA fornece uma API compatível com OpenAI em `https://integrate.api.nvidia.com/v1` para
modelos abertos gratuitamente. Autentique com uma chave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Primeiros passos

<Steps>
  <Step title="Obter sua chave de API">
    Crie uma chave de API em [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exportar a chave e executar o onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Definir um modelo NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Se você passar `--token` em vez da variável de ambiente, o valor ficará no histórico do shell e
na saída de `ps`. Prefira a variável de ambiente `NVIDIA_API_KEY` sempre que possível.
</Warning>

## Exemplo de configuração

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Catálogo integrado

| Ref do modelo                              | Nome                         | Contexto | Saída máxima |
| ------------------------------------------ | ---------------------------- | -------- | ------------ |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192        |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192        |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192        |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192        |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de auto-habilitação">
    O provedor é habilitado automaticamente quando a variável de ambiente `NVIDIA_API_KEY` está definida.
    Nenhuma configuração explícita adicional do provedor é necessária além da chave.
  </Accordion>

  <Accordion title="Catálogo e preços">
    O catálogo integrado é estático. Os custos usam `0` como padrão no código-fonte, já que a NVIDIA
    atualmente oferece acesso gratuito à API para os modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatível com OpenAI">
    A NVIDIA usa o endpoint padrão de completions `/v1`. Qualquer
    ferramenta compatível com OpenAI deve funcionar imediatamente com a base URL da NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Atualmente, os modelos da NVIDIA são gratuitos. Verifique
[build.nvidia.com](https://build.nvidia.com/) para ver a disponibilidade mais recente e
detalhes sobre limites de taxa.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
