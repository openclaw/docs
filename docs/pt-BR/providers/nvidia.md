---
read_when:
    - Você quer usar modelos abertos no OpenClaw gratuitamente
    - Você precisa configurar a NVIDIA_API_KEY
    - Você quer usar o Nemotron 3 Ultra por meio da NVIDIA
summary: Use a API da NVIDIA compatível com a OpenAI no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T00:19:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

A NVIDIA disponibiliza modelos abertos gratuitamente por meio de uma API compatível com a OpenAI em
`https://integrate.api.nvidia.com/v1`, autenticada com uma chave de API obtida em
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). Por padrão, o provedor NVIDIA do OpenClaw
usa o Nemotron 3 Ultra, modelo de raciocínio da NVIDIA com 550 bilhões de parâmetros
totais e 55 bilhões ativos, destinado a trabalhos agênticos de contexto longo.

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
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Para uma configuração não interativa, informe a chave diretamente:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` registra a chave no histórico do shell e na saída de `ps`. Sempre que possível, prefira a
variável de ambiente `NVIDIA_API_KEY`.
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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Catálogo em destaque

Quando uma chave de API da NVIDIA está configurada, os fluxos de configuração e seleção de modelos obtêm
o catálogo público de modelos em destaque da NVIDIA em
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` e
armazenam o resultado em cache por 24 horas (as primeiras 32 entradas, importadas como
linhas de entrada de texto livre). Portanto, novos modelos em destaque do build.nvidia.com aparecem nas
interfaces de configuração e seleção de modelos sem precisar aguardar uma versão do OpenClaw. Quando a
fonte em tempo real está disponível, o primeiro modelo retornado é a opção pré-selecionada
durante a configuração da NVIDIA.

A busca usa uma política fixa de host HTTPS para `assets.ngc.nvidia.com`. Se nenhuma
chave de API da NVIDIA estiver configurada, ou se a fonte estiver indisponível ou malformada,
o OpenClaw usará como alternativa o catálogo integrado e o padrão integrado descritos abaixo.

## Nemotron 3 Ultra

O Nemotron 3 Ultra é o modelo NVIDIA padrão no OpenClaw. A página do modelo da NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
o apresenta como um endpoint gratuito disponível, com uma especificação de contexto de 1 milhão de tokens.

Por padrão, a linha integrada do Ultra envia
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
para que a saída normal do chat permaneça na resposta visível, em vez de
expor o texto de raciocínio.

Use o Ultra como a opção padrão de maior capacidade da NVIDIA. Mantenha o Super selecionado quando
quiser a opção menor do Nemotron 3 ou escolha um dos modelos de terceiros
hospedados no catálogo da NVIDIA quando o contexto, a latência ou o comportamento deles for mais adequado.

## Catálogo alternativo integrado

As linhas integradas selecionáveis são um retrato do catálogo de modelos em destaque da NVIDIA. As linhas de
compatibilidade obsoletas continuam acessíveis por referência exata, mas não aparecem nos
seletores de modelos.

| Referência do modelo                       | Nome                  | Contexto  | Saída máxima |
| ------------------------------------------ | --------------------- | --------- | ------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192        |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192        |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192        |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192        |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192        |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384       |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384       |

O catálogo completo de compatibilidade também mantém estas referências já disponibilizadas para configurações
existentes: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` e
`nvidia/minimaxai/minimax-m2.7`. Elas continuam disponíveis por referência exata, mas
nunca aparecem na integração inicial nem nos seletores de modelos.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de ativação automática">
    O provedor é ativado automaticamente quando a variável de ambiente `NVIDIA_API_KEY` está
    definida ou uma chave foi armazenada durante a integração inicial. Nenhuma configuração explícita do provedor é
    necessária além da chave.
  </Accordion>

  <Accordion title="Catálogo e preços">
    O OpenClaw prioriza o catálogo público de modelos em destaque da NVIDIA quando a autenticação da NVIDIA está
    configurada e o armazena em cache por 24 horas. A alternativa integrada selecionável é um
    retrato estático do catálogo de modelos em destaque da NVIDIA; as linhas obsoletas de compatibilidade
    por referência exata ficam ocultas nos seletores de modelos. Os custos são definidos como `0` por padrão no
    código-fonte, pois atualmente a NVIDIA oferece acesso gratuito à API para os modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatível com a OpenAI">
    O OpenClaw se comunica com a NVIDIA por meio do adaptador `openai-completions` usando a
    rota padrão `/v1` de conclusões de chat. Qualquer ferramenta compatível com a OpenAI deve
    funcionar imediatamente com a URL base da NVIDIA.
  </Accordion>

  <Accordion title="Parâmetros de raciocínio do Nemotron 3 Ultra">
    A solicitação de exemplo do Ultra fornecida pela NVIDIA usa `chat_template_kwargs.enable_thinking`
    e `reasoning_budget` para a saída de raciocínio. A linha integrada do Ultra no OpenClaw
    desativa por padrão o raciocínio do modelo de formatação para o uso normal do chat. Se você precisar
    habilitar a saída de raciocínio da NVIDIA ou forçar outros campos de solicitação
    específicos da NVIDIA, defina parâmetros por modelo e mantenha as substituições específicas do provedor limitadas ao
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

    `params.chat_template_kwargs` é mesclado a qualquer `chat_template_kwargs`
    já presente na solicitação, em vez de substituir o objeto inteiro.
    `params.extra_body` é a substituição final do corpo da solicitação compatível com a OpenAI
    e sobrescreve chaves coincidentes da carga útil; portanto, use-o somente para campos que a NVIDIA
    documenta para o endpoint selecionado.

  </Accordion>

  <Accordion title="Respostas lentas de provedores personalizados">
    Alguns modelos personalizados hospedados pela NVIDIA podem demorar mais do que o monitor de inatividade
    padrão do modelo, de aproximadamente 120 segundos, antes de emitir o primeiro fragmento da resposta. Para entradas
    personalizadas do provedor NVIDIA, aumente o tempo limite do provedor, em vez do tempo limite de todo o
    ambiente de execução do agente; `timeoutSeconds` abrange as solicitações HTTP do provedor e
    aumenta o limite do monitor de inatividade/transmissão para esse provedor:

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
Atualmente, os modelos NVIDIA podem ser usados gratuitamente. Consulte
[build.nvidia.com](https://build.nvidia.com/) para obter os detalhes mais recentes sobre disponibilidade e
limites de taxa.
</Tip>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Referência completa de configuração para agentes, modelos e provedores.
  </Card>
</CardGroup>
