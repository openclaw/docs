---
read_when:
    - Você quer usar modelos abertos no OpenClaw gratuitamente
    - Você precisa configurar NVIDIA_API_KEY
    - Você quer usar o Nemotron 3 Ultra por meio da NVIDIA
summary: Use a API compatível com OpenAI da NVIDIA no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:05:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

A NVIDIA fornece uma API compatível com OpenAI em `https://integrate.api.nvidia.com/v1` para
modelos abertos gratuitamente. Autentique-se com uma chave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). O OpenClaw
define por padrão o provedor NVIDIA como Nemotron 3 Ultra, o modelo de raciocínio
ativo da NVIDIA com 550B total / 55B ativos para trabalho agêntico de contexto longo.

## Introdução

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

Quando uma chave de API da NVIDIA está configurada, os caminhos de configuração e seleção de modelo
do OpenClaw tentam usar o catálogo público de modelos em destaque da NVIDIA em
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` e
armazenam em cache o resultado ranqueado por 24 horas. Assim, novos modelos em destaque de build.nvidia.com
aparecem nas superfícies de configuração e seleção de modelo sem aguardar uma
versão do OpenClaw. Quando o feed ao vivo está disponível, o primeiro modelo retornado é
a opção padrão mostrada durante a configuração da NVIDIA.

A busca usa uma política fixa de host HTTPS para `assets.ngc.nvidia.com`. Se nenhuma
chave de API da NVIDIA estiver configurada, ou se esse catálogo público estiver indisponível ou
malformado, o OpenClaw recorre ao catálogo empacotado e ao padrão empacotado abaixo.

## Nemotron 3 Ultra

Nemotron 3 Ultra é o modelo NVIDIA padrão no OpenClaw. A página de build da NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
o lista como um endpoint gratuito disponível com especificação de contexto de 1M de tokens.
O catálogo empacotado registra uma saída máxima de 16.384 tokens para corresponder à solicitação
de exemplo atual compatível com OpenAI da NVIDIA para o endpoint hospedado.

Use o Ultra para o padrão NVIDIA de maior capacidade. Mantenha o Super selecionado quando
quiser a opção menor do Nemotron 3, ou escolha um dos modelos de terceiros
hospedados no catálogo da NVIDIA quando o contexto, a latência ou o comportamento deles se ajustarem melhor.
A linha Ultra empacotada envia `chat_template_kwargs.enable_thinking: false` e
`force_nonempty_content: true` por padrão para que a saída normal de chat permaneça na
resposta visível em vez de expor texto de raciocínio.

## Catálogo de fallback empacotado

| Ref. do modelo                            | Nome                         | Contexto  | Saída máx. | Observações                                  |
| ----------------------------------------- | ---------------------------- | --------- | ---------- | -------------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | Padrão                                      |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | Fallback em destaque                         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | Fallback em destaque                         |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | Fallback em destaque                         |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | Fallback em destaque                         |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | Obsoleto, compatibilidade de upgrade         |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | Obsoleto, compatibilidade de upgrade         |

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de ativação automática">
    O provedor é ativado automaticamente quando a variável de ambiente `NVIDIA_API_KEY` está definida.
    Nenhuma configuração explícita do provedor é necessária além da chave.
  </Accordion>

  <Accordion title="Catálogo e preços">
    O OpenClaw prefere o catálogo público de modelos em destaque da NVIDIA quando a autenticação da NVIDIA está
    configurada e o armazena em cache por 24 horas. O catálogo de fallback empacotado é estático
    e mantém refs enviados obsoletos para compatibilidade de upgrade. Os custos são padronizados
    como `0` no código-fonte, pois a NVIDIA atualmente oferece acesso gratuito à API para os
    modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatível com OpenAI">
    A NVIDIA usa o endpoint padrão de completions `/v1`. Qualquer ferramenta compatível com OpenAI
    deve funcionar imediatamente com a URL base da NVIDIA.
  </Accordion>

  <Accordion title="Parâmetros de raciocínio do Nemotron 3 Ultra">
    A solicitação de exemplo do Ultra da NVIDIA usa `chat_template_kwargs.enable_thinking`
    e `reasoning_budget` para saída de raciocínio. A linha Ultra empacotada do OpenClaw
    desativa o pensamento por template por padrão para uso normal de chat. Se você precisar
    optar pela saída de raciocínio da NVIDIA ou forçar outros campos de solicitação
    específicos da NVIDIA, defina parâmetros por modelo e mantenha as substituições específicas do provedor
    restritas ao modelo NVIDIA:

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

    `params.extra_body` é a substituição final do corpo da solicitação compatível com OpenAI, portanto
    use-a apenas para campos que a NVIDIA documenta para o endpoint selecionado.

  </Accordion>

  <Accordion title="Respostas lentas de provedor personalizado">
    Alguns modelos personalizados hospedados pela NVIDIA podem levar mais tempo que o watchdog ocioso
    padrão do modelo antes de emitirem o primeiro bloco de resposta. Para entradas personalizadas de provedor NVIDIA,
    aumente o tempo limite do provedor em vez de aumentar o tempo limite de execução
    de todo o agente:

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
No momento, os modelos NVIDIA são gratuitos para uso. Consulte
[build.nvidia.com](https://build.nvidia.com/) para ver a disponibilidade mais recente e
os detalhes de limite de taxa.
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
