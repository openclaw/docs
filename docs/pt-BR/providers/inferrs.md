---
read_when:
    - Você quer executar o OpenClaw com um servidor inferrs local
    - Você está servindo o Gemma ou outro modelo por meio do inferrs
    - Você precisa dos sinalizadores de compatibilidade exatos do OpenClaw para inferrs
summary: Execute o OpenClaw por meio do inferrs (servidor local compatível com OpenAI)
title: Infere
x-i18n:
    generated_at: "2026-05-06T09:11:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) pode servir modelos locais por trás de uma API `/v1` compatível com OpenAI. OpenClaw funciona com `inferrs` pelo caminho genérico `openai-completions`.

| Propriedade        | Valor                                                              |
| ------------------ | ------------------------------------------------------------------ |
| ID do provedor     | `inferrs` (personalizado; configure em `models.providers.inferrs`) |
| Plugin             | nenhum — `inferrs` não é um provider plugin OpenClaw empacotado    |
| Variável env. auth | Opcional. Qualquer valor funciona se o servidor inferrs não tiver autenticação |
| API                | compatível com OpenAI (`openai-completions`)                       |
| URL base sugerida  | `http://127.0.0.1:8080/v1` (ou onde quer que seu servidor inferrs esteja) |

<Note>
  Atualmente, `inferrs` é melhor tratado como um backend personalizado auto-hospedado compatível com OpenAI, não como um provider plugin dedicado do OpenClaw. Você o configura por meio de `models.providers.inferrs`, em vez de uma flag de escolha no onboarding. Se precisar de um Plugin realmente empacotado com descoberta automática, consulte [SGLang](/pt-BR/providers/sglang) ou [vLLM](/pt-BR/providers/vllm).
</Note>

## Primeiros passos

<Steps>
  <Step title="Inicie o inferrs com um modelo">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verifique se o servidor está acessível">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Adicione uma entrada de provedor OpenClaw">
    Adicione uma entrada de provedor explícita e aponte seu modelo padrão para ela. Veja o exemplo completo de configuração abaixo.
  </Step>
</Steps>

## Exemplo completo de configuração

Este exemplo usa Gemma 4 em um servidor `inferrs` local.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Por que requiresStringContent é importante">
    Algumas rotas de Chat Completions do `inferrs` aceitam apenas
    `messages[].content` em string, não arrays estruturados de partes de conteúdo.

    <Warning>
    Se execuções do OpenClaw falharem com um erro como:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    defina `compat.requiresStringContent: true` na entrada do seu modelo.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    O OpenClaw achatará partes de conteúdo de texto puro em strings simples antes de enviar
    a solicitação.

  </Accordion>

  <Accordion title="Observação sobre Gemma e esquema de ferramentas">
    Algumas combinações atuais de `inferrs` + Gemma aceitam solicitações diretas pequenas de
    `/v1/chat/completions`, mas ainda falham em turnos completos do agent-runtime do OpenClaw.

    Se isso acontecer, tente isto primeiro:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Isso desativa a superfície de esquema de ferramentas do OpenClaw para o modelo e pode reduzir a pressão
    de prompt em backends locais mais rigorosos.

    Se solicitações diretas pequenas ainda funcionarem, mas turnos normais de agente do OpenClaw continuarem
    travando dentro do `inferrs`, o problema restante geralmente é comportamento upstream do modelo/servidor,
    e não a camada de transporte do OpenClaw.

  </Accordion>

  <Accordion title="Teste de fumaça manual">
    Depois de configurado, teste as duas camadas:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Se o primeiro comando funcionar, mas o segundo falhar, consulte a seção de solução de problemas abaixo.

  </Accordion>

  <Accordion title="Comportamento em estilo proxy">
    `inferrs` é tratado como um backend `/v1` compatível com OpenAI em estilo proxy, não como um
    endpoint OpenAI nativo.

    - A modelagem de solicitações exclusiva da OpenAI nativa não se aplica aqui
    - Sem `service_tier`, sem Responses `store`, sem dicas de cache de prompt e sem
      modelagem de payload de compatibilidade de raciocínio da OpenAI
    - Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
      não são injetados em URLs base personalizadas do `inferrs`

  </Accordion>
</AccordionGroup>

## Solução de problemas

<AccordionGroup>
  <Accordion title="curl /v1/models falha">
    `inferrs` não está em execução, não está acessível ou não está vinculado ao
    host/porta esperados. Verifique se o servidor foi iniciado e está escutando no endereço que você
    configurou.
  </Accordion>

  <Accordion title="messages[].content esperava uma string">
    Defina `compat.requiresStringContent: true` na entrada do modelo. Consulte a
    seção `requiresStringContent` acima para obter detalhes.
  </Accordion>

  <Accordion title="Chamadas diretas de /v1/chat/completions passam, mas openclaw infer model run falha">
    Tente definir `compat.supportsTools: false` para desativar a superfície de esquema de ferramentas.
    Consulte a observação sobre esquema de ferramentas do Gemma acima.
  </Accordion>

  <Accordion title="inferrs ainda trava em turnos de agente maiores">
    Se o OpenClaw não receber mais erros de esquema, mas o `inferrs` ainda travar em turnos maiores
    de agente, trate isso como uma limitação upstream do `inferrs` ou do modelo. Reduza
    a pressão do prompt ou mude para outro backend ou modelo local.
  </Accordion>
</AccordionGroup>

<Tip>
Para ajuda geral, consulte [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Tip>

## Relacionados

<CardGroup cols={2}>
  <Card title="Modelos locais" href="/pt-BR/gateway/local-models" icon="server">
    Executando o OpenClaw com servidores de modelos locais.
  </Card>
  <Card title="Solução de problemas do Gateway" href="/pt-BR/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Depurando backends locais compatíveis com OpenAI que passam em verificações, mas falham em execuções de agente.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Visão geral de todos os provedores, referências de modelo e comportamento de failover.
  </Card>
</CardGroup>
