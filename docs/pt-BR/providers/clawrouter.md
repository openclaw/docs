---
read_when:
    - Você quer uma única chave gerenciada para vários provedores de modelos
    - Você precisa da descoberta de modelos ou de relatórios de cota do ClawRouter no OpenClaw
summary: Encaminhe modelos com escopo de credenciais pelo ClawRouter e mostre as cotas gerenciadas
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T12:51:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

O ClawRouter fornece ao OpenClaw uma chave com escopo de política para vários
provedores de modelos upstream. O plugin `clawrouter` incluído descobre apenas os modelos permitidos
para essa chave, encaminha cada modelo por meio do protocolo declarado e informa
o orçamento da chave e o uso agregado nas superfícies de uso do OpenClaw.

As credenciais upstream e o encaminhamento específico de cada provedor permanecem no ClawRouter, portanto
nunca é necessário instalar nem autenticar o plugin de cada provedor upstream no
host do OpenClaw. O plugin é fornecido com o OpenClaw (`enabledByDefault: true`);
é necessária apenas uma credencial emitida pelo ClawRouter.

| Propriedade         | Valor                                    |
| ------------------- | ---------------------------------------- |
| Provedor            | `clawrouter`                       |
| Plugin              | incluído (fornecido com o OpenClaw)      |
| Autenticação        | `CLAWROUTER_API_KEY`                       |
| URL padrão          | `https://clawrouter.openclaw.ai`                       |
| Catálogo de modelos | Com escopo de credencial via `/v1/catalog` |
| Cotas               | Orçamento mensal e uso via `/v1/usage` |

## Primeiros passos

<Steps>
  <Step title="Obter uma credencial com escopo">
    Solicite ao administrador do ClawRouter uma credencial cuja política inclua
    os provedores, modelos e o orçamento mensal que devem ser usados. As credenciais são
    exibidas uma única vez quando emitidas.
  </Step>
  <Step title="Configurar o OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` é incluído e habilitado por padrão. Se a configuração definir
    `plugins.allow`, adicione `clawrouter` a essa lista antes de habilitá-lo. Para uma
    implantação personalizada, defina `models.providers.clawrouter.baseUrl` como a
    origem do ClawRouter; o padrão é `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Listar os modelos concedidos">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Use as referências de modelo retornadas exatamente como exibidas. Elas mantêm o namespace
    upstream, como `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` ou
    `clawrouter/google/gemini-3.5-flash`. Se `agents.defaults.models` for uma
    lista de permissões na configuração, adicione a ela cada referência selecionada do ClawRouter.

  </Step>
  <Step title="Selecionar um modelo">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Também é possível selecionar um modelo retornado para uma execução com
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Implantação não interativa gerenciada

Mantenha a chave do proxy na injeção de segredos da carga de trabalho e armazene apenas uma
SecretRef em `openclaw.json`. Os campos gerenciados canônicos são:

| Finalidade      | Campo de configuração ou ambiente                                         |
| --------------- | ------------------------------------------------------------------------- |
| Origem do roteador | `models.providers.clawrouter.baseUrl`                                    |
| Credencial      | `models.providers.clawrouter.apiKey` -> SecretRef de ambiente                  |
| Valor do segredo | `CLAWROUTER_API_KEY` no ambiente do processo do Gateway                  |
| Modelo padrão   | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`       |
| Tag da carga de trabalho | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opcional) |

Por exemplo, um controlador de implantação pode gerenciar este patch JSON5:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Se a implantação definir `plugins.allow`, preserve as entradas existentes e adicione
`clawrouter`. Valide e aplique sem um assistente interativo:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

A simulação resolve a SecretRef, mas nunca imprime seu valor. Para alternar a
credencial, atualize o Secret externo que fornece `CLAWROUTER_API_KEY` e
reinicie a carga de trabalho do Gateway para que o novo ambiente do processo seja carregado. O
arquivo de configuração e a referência do modelo não são alterados.

Para um Gateway Docker independente compilado a partir do código-fonte, o ClawRouter já está incluído no
runtime raiz. Selecione apenas o plugin de canal que precisa de empacotamento separado,
como `OPENCLAW_EXTENSIONS=clickclack`, `slack` ou `msteams`; consulte
[imagens compiladas a partir do código-fonte com plugins selecionados](/pt-BR/install/docker#source-built-images-with-selected-plugins).
Implantações de arquivo/appliance devem empacotar o mesmo código-fonte integrado por meio de seu
próprio pipeline de artefatos, em vez de consumir a imagem OCI.

## Prontidão e comprovação em produção

Estas verificações comprovam limites diferentes; não substitua uma por outra:

```bash
# Apenas a integridade do processo do ClawRouter; nenhuma credencial ou modelo upstream é exercitado.
curl -fsS https://clawrouter.internal.example/v1/health

# Apenas a prontidão de inicialização do Gateway do OpenClaw; nenhuma chamada de modelo é feita.
curl -fsS http://127.0.0.1:18789/readyz

# Descoberta do catálogo com escopo de credencial.
openclaw models list --all --provider clawrouter --json

# Sondagem mínima de inferência real por meio do provedor ClawRouter configurado.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Canary da carga de trabalho usando uma referência exata de modelo concedido.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Responda exatamente: CLAWROUTER_CANARY_OK" \
  --json
```

Use um modelo retornado pelo catálogo com escopo, em vez de copiar o modelo de exemplo
sem verificar. Uma resposta `/readyz` bem-sucedida significa que o Gateway pode atender
a solicitações; ela não afirma que o ClawRouter, sua credencial ou um provedor
upstream esteja pronto. A sondagem do modelo e o canary do agente são as comprovações de inferência.

Para diagnóstico em produção, execute o canary e inspecione os logs padrão do Gateway.
Os diagnósticos existentes de transporte de modelo somente com metadados emitem linhas com o seguinte formato:

```text
[model-fetch] início provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] resposta provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

O plugin envia os cabeçalhos limitados `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` e
`X-ClawRouter-Session-Id` quando esses identificadores estão disponíveis. Ele também
mapeia o `callId` de diagnóstico da chamada do modelo (`<run-id>:model:<n>`) para
`X-Request-ID`, para que um evento de chamada de modelo do OpenClaw possa ser correlacionado com a
trilha de auditoria somente com metadados do ClawRouter. Valores dentro do limite de 128 caracteres do ID da solicitação são
idênticos. Valores mais longos mantêm o sufixo `:model:<n>` e um hash
determinístico, para que chamadas distintas permaneçam limitadas e correlacionáveis. Metadados estáticos da implantação,
como `X-ClawRouter-Project-Id`, podem ser definidos no mapa `headers` do provedor.
Os cabeçalhos de atribuição de agente e sessão mantêm seu limite separado de 256 caracteres.
IDs de solicitação automáticos que contêm caracteres fora do conjunto de identificadores ASCII do ClawRouter
usam a mesma forma determinística e limitada.
Cabeçalhos configurados explicitamente, incluindo qualquer variação de maiúsculas e minúsculas de `X-Request-ID`, têm
precedência sobre os valores automáticos. O diagnóstico de transporte registra metadados de roteamento e resposta;
ele não registra credenciais, IDs de solicitação, prompts nem conclusões.
O próprio evento de auditoria do ClawRouter fornece o provedor upstream selecionado e
o estado de retenção de conteúdo.

## Descoberta de modelos

`GET /v1/catalog` retorna `{ providers: [...] }`, em que cada entrada de provedor
lista seus próprios `models[]` (com ID upstream, recursos e preços) e suas
rotas de solicitação compatíveis. O OpenClaw não fornece uma segunda lista fixa de
modelos do ClawRouter. Um modelo do catálogo é anunciado como modelo do OpenClaw quando:

- a política da credencial concede acesso ao provedor;
- o modelo do catálogo anuncia um recurso de LLM compatível (`llm.responses`,
  `llm.chat`, `llm.messages` ou `llm.stream` com uma rota de streaming
  correspondente); e
- o provedor expõe uma rota correspondente para um dos transportes abaixo.

Adicionar um modelo a um provedor ClawRouter compatível não requer uma versão do OpenClaw:
a próxima atualização do catálogo (armazenada em cache por 60 segundos por escopo de credencial) o descobre.
Um modelo que precisa de um novo protocolo de comunicação requer primeiro suporte do plugin.

## Plugins de protocolo e provedor

O ClawRouter gerencia as credenciais upstream; seu catálogo informa ao OpenClaw qual
transporte usar, portanto nunca é necessário instalar o plugin de autenticação de cada empresa upstream.

| Recurso/rota do catálogo                                  | Transporte do OpenClaw |
| --------------------------------------------------------- | ---------------------- |
| `llm.responses` (provedor compatível com OpenAI)       | `openai-responses`     |
| `llm.chat` (provedor compatível com OpenAI)       | `openai-completions`     |
| `llm.messages` + rota `anthropic.messages`              | `anthropic-messages`     |
| `llm.stream` + rota de streaming `google.generate_content` | `google-generative-ai`     |

O plugin também aplica as políticas correspondentes de repetição e esquema de ferramentas para essas
famílias (compatibilidade de esquema de ferramentas do OpenAI/DeepSeek/Gemini/Perplexity; políticas nativas
de repetição do Anthropic e Google Gemini). Os modelos do Perplexity recebem uma reescrita rigorosa
do esquema: `patternProperties` e `additionalProperties` são removidos, e
cada esquema de objeto declara `properties`, pois o Perplexity rejeita esquemas de
ferramentas sem eles. Um provedor do catálogo que expõe apenas um
formato de solicitação incompatível não é anunciado intencionalmente como um modelo de
texto do OpenClaw. Normalize esses provedores para um dos contratos compatíveis no
ClawRouter, em vez de enviar uma carga incompatível.

## Cotas e uso

A resposta `/v1/usage` do ClawRouter alimenta as superfícies normais de uso do provedor no OpenClaw:
totais de solicitações, tokens e gastos, além de uma janela de orçamento mensal quando
a chave tem um limite. Chaves sem medição ainda exibem o uso agregado sem uma
janela percentual.

A consulta de cotas usa a mesma chave com escopo que a descoberta de modelos. Uma falha na consulta de
cotas não bloqueia a execução do modelo.

Verifique o instantâneo em produção com:

```bash
openclaw status --usage
openclaw models status
```

O mesmo instantâneo do provedor está disponível para `/status` no chat e na
interface de uso do OpenClaw. O orçamento abrange toda a política, portanto solicitações feitas por outro cliente usando
a mesma política do ClawRouter podem alterar o percentual restante.

## Solução de problemas

| Sintoma                                      | Verificação                                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Nenhum modelo do ClawRouter                  | Confirme que o plugin está habilitado e permitido por `plugins.allow`; depois, verifique se a credencial está ativa e concede pelo menos um provedor pronto. |
| Um modelo configurado do ClawRouter está ausente | Inspecione o recurso `/v1/catalog` e o suporte a rotas. Contratos de transporte incompatíveis são filtrados intencionalmente.             |
| `Unknown model: clawrouter/...`                           | Adicione a referência exata do catálogo a `agents.defaults.models` quando esse mapa de configuração estiver sendo usado como lista de permissões.      |
| `401` ou `403` do catálogo ou do uso | Emita novamente ou altere o escopo da credencial do ClawRouter; o OpenClaw não recorre às chaves dos provedores upstream.             |
| A chamada do modelo falha após a descoberta  | Verifique a conexão do provedor e a integridade upstream no ClawRouter; depois, tente novamente quando o estado de prontidão for restabelecido.  |
| O uso tem totais, mas não tem percentual     | A política não tem medição; adicione um orçamento mensal no ClawRouter para expor uma janela percentual.                                        |

## Comportamento de segurança

- A descoberta do catálogo é limitada à chave de proxy configurada e armazenada em cache por escopo de credencial (diretório do agente, diretório do espaço de trabalho, id do perfil de autenticação e URL base).
- A chave de proxy é anexada somente no envio da solicitação; ela não é armazenada nos metadados do modelo.
- Os valores automáticos de atribuição e correlação de solicitações têm os espaços em branco removidos das extremidades e são rejeitados se contiverem caracteres de controle antes do envio. Os valores de atribuição são limitados a 256 caracteres; os ids de solicitação são limitados a 128.
- Os diagnósticos de transporte do modelo contêm apenas metadados e nunca incluem a chave de proxy nem o conteúdo do modelo.
- Os ids de modelos nativos da Anthropic e do Gemini são reescritos para seus ids de upstream somente no envio.
- As linhas do catálogo sem suporte ou sem permissão falham de forma segura e não podem ser selecionadas.

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Configuração de provedores e seleção de modelos.
  </Card>
  <Card title="Monitoramento de uso" href="/pt-BR/concepts/usage-tracking" icon="chart-line">
    Interfaces de uso e status do OpenClaw.
  </Card>
</CardGroup>
