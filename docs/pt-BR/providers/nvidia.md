---
read_when:
    - Você quer usar modelos abertos gratuitamente no OpenClaw
    - Você precisa configurar a NVIDIA_API_KEY
    - Você quer usar o Nemotron 3 Ultra por meio da NVIDIA
summary: Use a API compatível com OpenAI da NVIDIA no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T15:32:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

A NVIDIA disponibiliza modelos abertos gratuitamente por meio de uma API compatível com a OpenAI em
`https://integrate.api.nvidia.com/v1`, autenticada com uma chave de API obtida em
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). Por padrão, o OpenClaw
usa o Nemotron 3 Ultra no provedor NVIDIA, o modelo de raciocínio da NVIDIA com 550B
de parâmetros totais / 55B ativos para trabalho agêntico com contexto longo.

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API em [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporte a chave e execute a configuração inicial">
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

Para uma configuração não interativa, forneça a chave diretamente:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` registra a chave no histórico do shell e na saída de `ps`. Quando
possível, prefira a variável de ambiente `NVIDIA_API_KEY`.
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

Quando uma chave de API da NVIDIA está configurada, os fluxos de configuração e
seleção de modelos buscam o catálogo público de modelos em destaque da NVIDIA em
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` e
armazenam o resultado em cache por 24 horas (as primeiras 32 entradas, importadas
como linhas de entrada de texto livre). Assim, novos modelos em destaque do
build.nvidia.com aparecem nas interfaces de configuração e seleção de modelos sem
a necessidade de aguardar uma versão do OpenClaw. Quando o feed em tempo real está
disponível, o primeiro modelo retornado é a opção pré-selecionada durante a
configuração da NVIDIA.

A busca usa uma política fixa de host HTTPS para `assets.ngc.nvidia.com`. Se
nenhuma chave de API da NVIDIA estiver configurada, ou se o feed estiver
indisponível ou malformado, o OpenClaw usa como alternativa o catálogo incluído e
o padrão incluído abaixo.

## Nemotron 3 Ultra

O Nemotron 3 Ultra é o modelo NVIDIA padrão no OpenClaw. A página de desenvolvimento
da NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
o lista como um endpoint gratuito disponível com uma especificação de contexto de
1M tokens.

A linha incluída do Ultra envia
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
por padrão, para que a saída normal do chat permaneça na resposta visível em vez
de expor o texto de raciocínio.

Use o Ultra como o padrão NVIDIA de maior capacidade. Mantenha o Super selecionado
quando quiser a opção menor do Nemotron 3 ou escolha um dos modelos de terceiros
hospedados no catálogo da NVIDIA quando o contexto, a latência ou o comportamento
deles forem mais adequados.

## Catálogo alternativo incluído

As linhas selecionáveis incluídas são um instantâneo do catálogo de modelos em
destaque da NVIDIA. As linhas de compatibilidade obsoletas continuam podendo ser
resolvidas pela referência exata, mas permanecem fora dos seletores de modelos.

| Referência do modelo                       | Nome                  | Contexto  | Saída máxima |
| ------------------------------------------ | --------------------- | --------- | ------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192        |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192        |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192        |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192        |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192        |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384       |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384       |

O catálogo completo de compatibilidade também mantém estas referências já
distribuídas para configurações existentes: `nvidia/moonshotai/kimi-k2.5`,
`nvidia/z-ai/glm-5.1`, `nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` e
`nvidia/minimaxai/minimax-m2.7`. Elas continuam disponíveis pela referência exata,
mas nunca aparecem na configuração inicial nem nos seletores de modelos.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Comportamento de ativação automática">
    O provedor é ativado automaticamente quando a variável de ambiente
    `NVIDIA_API_KEY` está definida ou quando uma chave foi armazenada durante a
    configuração inicial. Além da chave, nenhuma configuração explícita do
    provedor é necessária.
  </Accordion>

  <Accordion title="Catálogo e preços">
    O OpenClaw prioriza o catálogo público de modelos em destaque da NVIDIA quando
    a autenticação da NVIDIA está configurada e o armazena em cache por 24 horas.
    A alternativa selecionável incluída é um instantâneo estático do catálogo de
    modelos em destaque da NVIDIA; as linhas obsoletas de compatibilidade por
    referência exata ficam ocultas nos seletores de modelos. Os custos usam `0`
    como padrão no código-fonte, pois atualmente a NVIDIA oferece acesso gratuito
    à API para os modelos listados.
  </Accordion>

  <Accordion title="Endpoint compatível com a OpenAI">
    O OpenClaw se comunica com a NVIDIA usando o adaptador `openai-completions`
    pela rota padrão `/v1` de conclusões de chat. Qualquer ferramenta compatível
    com a OpenAI deve funcionar imediatamente com a URL base da NVIDIA.
  </Accordion>

  <Accordion title="Parâmetros de raciocínio do Nemotron 3 Ultra">
    A solicitação de exemplo do Ultra fornecida pela NVIDIA usa
    `chat_template_kwargs.enable_thinking` e `reasoning_budget` para a saída de
    raciocínio. A linha incluída do Ultra no OpenClaw desativa por padrão o
    raciocínio do modelo para o uso normal do chat. Se você precisar ativar a
    saída de raciocínio da NVIDIA ou forçar outros campos de solicitação
    específicos da NVIDIA, defina os parâmetros por modelo e mantenha as
    substituições específicas do provedor restritas ao modelo NVIDIA:

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
    `params.extra_body` é a substituição final do corpo da solicitação compatível
    com a OpenAI e sobrescreve as chaves conflitantes da carga útil; portanto,
    use-o somente para os campos documentados pela NVIDIA para o endpoint
    selecionado.

  </Accordion>

  <Accordion title="Respostas lentas de provedores personalizados">
    Alguns modelos personalizados hospedados pela NVIDIA podem levar mais tempo
    que o monitor de inatividade padrão do modelo, de aproximadamente 120s, antes
    de emitir o primeiro fragmento da resposta. Para entradas personalizadas do
    provedor NVIDIA, aumente o tempo limite do provedor em vez do tempo limite de
    todo o runtime do agente; `timeoutSeconds` abrange as solicitações HTTP do
    provedor e aumenta o limite do monitor de inatividade/streaming para esse
    provedor:

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
[build.nvidia.com](https://build.nvidia.com/) para obter os detalhes mais recentes
sobre disponibilidade e limites de taxa.
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
