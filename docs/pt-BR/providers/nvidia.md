---
read_when:
    - Você quer usar modelos abertos no OpenClaw gratuitamente
    - É necessário configurar NVIDIA_API_KEY
summary: Use a API compatível com OpenAI da NVIDIA no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-30T10:05:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

A NVIDIA fornece uma API compatível com OpenAI em `https://integrate.api.nvidia.com/v1` para
modelos abertos gratuitamente. Autentique-se com uma chave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporte a chave e execute a integração inicial">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Defina um modelo NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Se você passar `--nvidia-api-key` em vez da variável de ambiente, o valor ficará no histórico
do shell e na saída de `ps`. Prefira a variável de ambiente `NVIDIA_API_KEY` quando
possível.
</Warning>

Para configuração não interativa, você também pode passar a chave diretamente:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

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

| Referência do modelo                         | Nome                         | Contexto | Saída máxima |
| -------------------------------------------- | ---------------------------- | -------- | ------------ |
| `nvidia/nvidia/nemotron-3-super-120b-a12b`   | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192        |
| `nvidia/moonshotai/kimi-k2.5`                | Kimi K2.5                    | 262,144  | 8,192        |
| `nvidia/minimaxai/minimax-m2.5`              | Minimax M2.5                 | 196,608  | 8,192        |
| `nvidia/z-ai/glm5`                           | GLM 5                        | 202,752  | 8,192        |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de ativação automática">
    O provedor é ativado automaticamente quando a variável de ambiente `NVIDIA_API_KEY` está definida.
    Nenhuma configuração explícita de provedor é necessária além da chave.
  </Accordion>

  <Accordion title="Catálogo e preços">
    O catálogo incluído é estático. Os custos usam `0` como padrão no código-fonte, já que a NVIDIA
    atualmente oferece acesso gratuito à API para os modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatível com OpenAI">
    A NVIDIA usa o endpoint padrão de conclusões `/v1`. Qualquer ferramenta compatível com OpenAI
    deve funcionar imediatamente com a URL base da NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
No momento, os modelos NVIDIA são gratuitos para uso. Consulte
[build.nvidia.com](https://build.nvidia.com/) para ver a disponibilidade mais recente e
os detalhes de limites de taxa.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
