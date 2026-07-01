---
read_when:
    - Você quer usar modelos abertos no OpenClaw gratuitamente
    - Você precisa configurar NVIDIA_API_KEY
    - Você quer usar o Nemotron 3 Ultra por meio da NVIDIA
summary: Use a API compatível com OpenAI da NVIDIA no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:16:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

A NVIDIA fornece uma API compatível com OpenAI em `https://integrate.api.nvidia.com/v1` para
modelos abertos gratuitamente. Autentique-se com uma chave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). O OpenClaw
define por padrão o provedor NVIDIA como Nemotron 3 Ultra, o modelo de raciocínio
ativo da NVIDIA com 550B no total / 55B ativos para trabalho agêntico de contexto longo.

## Primeiros passos

<Steps>
  <Step title="Get your API key">
    Crie uma chave de API em [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Catálogo em destaque

Quando uma chave de API da NVIDIA é configurada, os caminhos de configuração e seleção de modelo
do OpenClaw tentam usar o catálogo público de modelos em destaque da NVIDIA em
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` e
armazenam em cache o resultado classificado por 24 horas. Assim, novos modelos em destaque do build.nvidia.com
aparecem nas superfícies de configuração e seleção de modelo sem esperar por uma
versão do OpenClaw. Quando o feed ativo está disponível, o primeiro modelo retornado é
a opção padrão mostrada durante a configuração da NVIDIA.

A busca usa uma política fixa de host HTTPS para `assets.ngc.nvidia.com`. Se nenhuma
chave de API da NVIDIA estiver configurada, ou se esse catálogo público estiver indisponível ou
malformado, o OpenClaw recorre ao catálogo incluído e ao padrão incluído abaixo.

## Nemotron 3 Ultra

Nemotron 3 Ultra é o modelo NVIDIA padrão no OpenClaw. A página de build da NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
o lista como um endpoint gratuito disponível com uma especificação de contexto de 1M tokens.
O catálogo incluído registra uma saída máxima de 16.384 tokens para corresponder à solicitação de exemplo
compatível com OpenAI atual da NVIDIA para o endpoint hospedado.

Use o Ultra para o padrão NVIDIA de maior capacidade. Mantenha o Super selecionado quando
quiser a opção menor do Nemotron 3, ou escolha um dos modelos de terceiros
hospedados no catálogo da NVIDIA quando o contexto, a latência ou o comportamento deles se ajustar melhor.
A linha Ultra incluída envia `chat_template_kwargs.enable_thinking: false` e
`force_nonempty_content: true` por padrão para que a saída normal do chat permaneça na
resposta visível em vez de expor texto de raciocínio.

## Catálogo fallback incluído

| Ref. do modelo                              | Nome                         | Contexto  | Saída máxima | Observações                       |
| ------------------------------------------ | ---------------------------- | --------- | ------------ | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384       | Padrão                            |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192        | Fallback em destaque              |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192        | Fallback em destaque              |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192        | Fallback em destaque              |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192        | Fallback em destaque              |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192        | Obsoleto, compatibilidade de upgrade |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192        | Obsoleto, compatibilidade de upgrade |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    O provedor é habilitado automaticamente quando a variável de ambiente `NVIDIA_API_KEY` está definida.
    Nenhuma configuração explícita de provedor é necessária além da chave.
  </Accordion>

  <Accordion title="Catalog and pricing">
    O OpenClaw prefere o catálogo público de modelos em destaque da NVIDIA quando a autenticação NVIDIA está
    configurada e o armazena em cache por 24 horas. O catálogo fallback incluído é estático
    e mantém refs enviadas obsoletas para compatibilidade de upgrade. Os custos assumem o padrão
    `0` no código-fonte, pois a NVIDIA atualmente oferece acesso gratuito à API para os
    modelos listados.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    A NVIDIA usa o endpoint padrão de completions `/v1`. Qualquer ferramenta compatível com OpenAI
    deve funcionar imediatamente com a URL base da NVIDIA.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    A solicitação de exemplo do Ultra da NVIDIA usa `chat_template_kwargs.enable_thinking`
    e `reasoning_budget` para saída de raciocínio. A linha Ultra incluída do OpenClaw
    desabilita o pensamento por template por padrão para uso normal de chat. Se você precisar
    optar pela saída de raciocínio da NVIDIA ou forçar outros campos de solicitação específicos da NVIDIA,
    defina parâmetros por modelo e mantenha substituições específicas do provedor restritas ao
    modelo NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` é a substituição final do corpo da solicitação compatível com OpenAI, então
    use-a apenas para campos que a NVIDIA documenta para o endpoint selecionado.

  </Accordion>

  <Accordion title="Slow custom provider responses">
    Alguns modelos personalizados hospedados pela NVIDIA podem levar mais tempo que o watchdog ocioso
    padrão do modelo antes de emitirem o primeiro fragmento de resposta. Para entradas personalizadas de provedor NVIDIA,
    aumente o timeout do provedor em vez de aumentar o timeout de runtime do agente inteiro:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Atualmente, os modelos NVIDIA são gratuitos para uso. Consulte
[build.nvidia.com](https://build.nvidia.com/) para obter os detalhes mais recentes de disponibilidade e
limite de taxa.
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
