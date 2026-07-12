---
read_when:
    - Você quer uma única chave gerenciada para vários provedores de modelos
    - Você precisa da descoberta de modelos ou de relatórios de cota do ClawRouter no OpenClaw
summary: Encaminhe modelos com escopo de credenciais pelo ClawRouter e exiba as cotas gerenciadas
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T15:38:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

O ClawRouter fornece ao OpenClaw uma única chave com escopo de política para vários
provedores de modelos upstream. O plugin `clawrouter` incluído descobre somente os modelos permitidos
para essa chave, encaminha cada modelo por meio de seu protocolo declarado e informa
o orçamento e o uso agregado da chave nas superfícies de uso do OpenClaw.

As credenciais upstream e o encaminhamento específico de cada provedor permanecem no ClawRouter, portanto
você nunca instala nem autentica individualmente cada plugin de provedor upstream no
host do OpenClaw. O plugin é fornecido com o OpenClaw (`enabledByDefault: true`);
você precisa apenas de uma credencial emitida pelo ClawRouter.

| Propriedade         | Valor                                             |
| ------------------- | ------------------------------------------------- |
| Provedor            | `clawrouter`                                      |
| Plugin              | incluído (incluso no OpenClaw)                    |
| Autenticação        | `CLAWROUTER_API_KEY`                              |
| URL padrão          | `https://clawrouter.openclaw.ai`                  |
| Catálogo de modelos | Com escopo de credencial via `/v1/catalog`        |
| Cotas               | Orçamento mensal e uso via `/v1/usage`            |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma credencial com escopo">
    Solicite ao administrador do ClawRouter uma credencial cuja política inclua
    os provedores, modelos e o orçamento mensal que você deve usar. As credenciais são
    reveladas uma única vez quando emitidas.
  </Step>
  <Step title="Configure o OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    O `clawrouter` está incluído e habilitado por padrão. Se sua configuração definir
    `plugins.allow`, adicione `clawrouter` a essa lista antes de habilitá-lo. Para uma
    implantação personalizada, defina `models.providers.clawrouter.baseUrl` como a
    origem do ClawRouter; o padrão é `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Liste os modelos concedidos">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Use as referências de modelo retornadas exatamente como exibidas. Elas mantêm o namespace
    upstream, como `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` ou
    `clawrouter/google/gemini-3.5-flash`. Se `agents.defaults.models` for uma
    lista de permissões em sua configuração, adicione a ela cada referência selecionada do ClawRouter.

  </Step>
  <Step title="Selecione um modelo">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Você também pode selecionar um modelo retornado para uma execução com
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Implantação não interativa gerenciada

Mantenha a chave do proxy na injeção de segredos da carga de trabalho e armazene apenas uma
SecretRef em `openclaw.json`. Os campos gerenciados canônicos são:

| Finalidade             | Campo de configuração ou ambiente                                           |
| ---------------------- | --------------------------------------------------------------------------- |
| Origem do roteador     | `models.providers.clawrouter.baseUrl`                                       |
| Credencial             | `models.providers.clawrouter.apiKey` -> SecretRef de ambiente               |
| Valor do segredo       | `CLAWROUTER_API_KEY` no ambiente do processo do gateway                     |
| Modelo padrão          | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`          |
| Tag da carga de trabalho | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (opcional)   |

Por exemplo, um controlador de implantação pode ser responsável por este patch JSON5:

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

A simulação resolve a SecretRef, mas nunca exibe seu valor. Para rotacionar a
credencial, atualize o Secret externo que fornece `CLAWROUTER_API_KEY` e
reinicie a carga de trabalho do gateway para que o novo ambiente do processo seja carregado. O
arquivo de configuração e a referência do modelo não mudam.

Para um gateway Docker independente compilado a partir do código-fonte, o ClawRouter já está incluído no
runtime raiz. Selecione somente o plugin de canal que exige empacotamento separado,
como `OPENCLAW_EXTENSIONS=clickclack`, `slack` ou `msteams`; consulte
[imagens compiladas a partir do código-fonte com plugins selecionados](/pt-BR/install/docker#source-built-images-with-selected-plugins).
Implantações de arquivo/appliance devem empacotar o mesmo código-fonte integrado por meio de seu
próprio pipeline de artefatos, em vez de consumir a imagem OCI.

## Prontidão e comprovação em ambiente real

Estas verificações comprovam limites diferentes; não substitua uma pela outra:

```bash
# Somente a integridade do processo do ClawRouter; nenhuma credencial ou modelo upstream é exercitado.
curl -fsS https://clawrouter.internal.example/v1/health

# Somente a prontidão de inicialização do gateway do OpenClaw; nenhuma chamada de modelo é realizada.
curl -fsS http://127.0.0.1:18789/readyz

# Descoberta de catálogo com escopo de credencial.
openclaw models list --all --provider clawrouter --json

# Sondagem mínima de inferência real por meio do provedor ClawRouter configurado.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Canary da carga de trabalho usando uma referência exata de modelo concedido.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Responda exatamente: CLAWROUTER_CANARY_OK" \
  --json
```

Use um modelo retornado pelo catálogo com escopo em vez de copiar cegamente o
modelo de exemplo. Uma resposta bem-sucedida de `/readyz` significa que o gateway pode atender
a solicitações; ela não afirma que o ClawRouter, sua credencial ou um provedor
upstream está pronto. A sondagem de modelo e o canary do agente são as comprovações de inferência.

Para diagnóstico em ambiente real, execute o canary e inspecione os logs padrão do gateway.
Os diagnósticos existentes de transporte de modelo, somente com metadados, emitem linhas com este formato:

```text
[model-fetch] início provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] resposta provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

O plugin envia os cabeçalhos limitados `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` e
`X-ClawRouter-Session-Id` quando esses identificadores estão disponíveis. Ele também
mapeia o `callId` de diagnóstico da chamada de modelo (`<run-id>:model:<n>`) para
`X-Request-ID`, para que um evento de chamada de modelo do OpenClaw possa ser correlacionado à
trilha de auditoria do ClawRouter que contém somente metadados. Valores dentro do limite de 128 caracteres
do ID da solicitação são idênticos. Valores mais longos mantêm o sufixo `:model:<n>` e um hash
determinístico, para que chamadas distintas permaneçam limitadas e correlacionáveis. Metadados estáticos
da implantação, como `X-ClawRouter-Project-Id`, podem ser definidos no mapa `headers` do provedor.
Os cabeçalhos de atribuição de agente e sessão mantêm seu limite separado de 256 caracteres.
IDs de solicitação automáticos que contêm caracteres fora do conjunto de identificadores ASCII
do ClawRouter usam a mesma forma determinística e limitada.
Cabeçalhos configurados explicitamente, incluindo qualquer variação de maiúsculas e minúsculas de `X-Request-ID`, prevalecem
sobre os valores automáticos. O diagnóstico de transporte registra metadados de roteamento e resposta;
ele não registra credenciais, IDs de solicitação, prompts nem conclusões.
O evento de auditoria do próprio ClawRouter fornece o provedor upstream selecionado e
o estado de retenção de conteúdo.

## Descoberta de modelos

`GET /v1/catalog` retorna `{ providers: [...] }`, em que cada entrada de provedor
lista seus próprios `models[]` (com ID upstream, recursos e preços) e suas
rotas de solicitação compatíveis. O OpenClaw não fornece uma segunda lista fixa de
modelos do ClawRouter. Um modelo do catálogo é anunciado como modelo do OpenClaw quando:

- a política da credencial concede acesso ao seu provedor;
- o modelo do catálogo anuncia um recurso de LLM compatível (`llm.responses`,
  `llm.chat`, `llm.messages` ou `llm.stream` com uma rota de streaming
  correspondente); e
- o provedor expõe uma rota correspondente para um dos transportes abaixo.

Adicionar um modelo a um provedor ClawRouter compatível não exige uma versão do OpenClaw:
a próxima atualização do catálogo (armazenada em cache por 60 segundos por escopo de credencial) o descobre.
Um modelo que precise de um novo protocolo de comunicação exige primeiro suporte do plugin.

## Protocolos e plugins de provedores

O ClawRouter é responsável pelas credenciais upstream; seu catálogo informa ao OpenClaw qual
transporte usar, portanto você nunca instala o plugin de autenticação de cada empresa upstream.

| Recurso/rota do catálogo                                  | Transporte do OpenClaw  |
| --------------------------------------------------------- | ----------------------- |
| `llm.responses` (provedor compatível com OpenAI)          | `openai-responses`      |
| `llm.chat` (provedor compatível com OpenAI)               | `openai-completions`    |
| `llm.messages` + rota `anthropic.messages`                | `anthropic-messages`    |
| `llm.stream` + rota de streaming `google.generate_content` | `google-generative-ai` |

O plugin também aplica as políticas correspondentes de reprodução e esquema de ferramentas para essas
famílias (compatibilidade de esquema de ferramentas do OpenAI/DeepSeek/Gemini; políticas nativas de reprodução
do Anthropic e Google Gemini). Um provedor do catálogo que exponha somente um
formato de solicitação não compatível intencionalmente não é anunciado como um modelo de
texto do OpenClaw. Normalize esses provedores para um dos contratos compatíveis no
ClawRouter, em vez de enviar um payload incompatível.

## Cotas e uso

A resposta de `/v1/usage` do ClawRouter alimenta as superfícies normais de uso de provedores
do OpenClaw: totais de solicitações, tokens e gastos, além de uma janela de orçamento mensal quando
a chave possui um limite. Chaves sem medição ainda exibem o uso agregado sem uma
janela percentual.

A consulta de cota usa a mesma chave com escopo usada na descoberta de modelos. Uma falha na consulta
de cota não bloqueia a execução do modelo.

Verifique o snapshot atual com:

```bash
openclaw status --usage
openclaw models status
```

O mesmo snapshot do provedor está disponível para `/status` no chat e na
interface de uso do OpenClaw. O orçamento abrange toda a política, portanto solicitações feitas por outro cliente usando
a mesma política do ClawRouter podem alterar a porcentagem restante.

## Solução de problemas

| Sintoma                                    | Verificação                                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nenhum modelo do ClawRouter                | Confirme se o plugin está habilitado e permitido por `plugins.allow` e, em seguida, verifique se a credencial está ativa e concede pelo menos um provedor pronto.          |
| Um modelo configurado do ClawRouter não aparece | Inspecione o recurso e a compatibilidade de rota em `/v1/catalog`. Contratos de transporte não compatíveis são filtrados intencionalmente.                           |
| `Unknown model: clawrouter/...`            | Adicione a referência exata do catálogo a `agents.defaults.models` quando esse mapa de configuração estiver sendo usado como uma lista de permissões.                    |
| `401` ou `403` no catálogo ou uso          | Reemita ou altere o escopo da credencial do ClawRouter; o OpenClaw não recorre às chaves de provedores upstream como alternativa.                                        |
| A chamada de modelo falha após a descoberta | Verifique a conexão do provedor e a integridade upstream no ClawRouter e tente novamente após a recuperação do estado de prontidão.                                    |
| O uso tem totais, mas nenhuma porcentagem  | A política não tem medição; adicione um orçamento mensal no ClawRouter para disponibilizar uma janela percentual.                                                       |

## Comportamento de segurança

- A descoberta do catálogo é limitada à chave de proxy configurada e armazenada em cache por escopo de credencial (diretório do agente, diretório do workspace, id do perfil de autenticação e URL base).
- A chave de proxy é anexada somente no envio da solicitação; ela não é armazenada nos metadados do modelo.
- Os valores automáticos de atribuição e correlação de solicitações têm os espaços em branco removidos das extremidades e são rejeitados caso contenham caracteres de controle antes do envio. Os valores de atribuição são limitados a 256 caracteres; os ids de solicitação são limitados a 128.
- Os diagnósticos de transporte do modelo contêm apenas metadados e nunca incluem a chave de proxy nem o conteúdo do modelo.
- Os ids de modelos nativos da Anthropic e do Gemini são reescritos para seus ids no serviço de origem somente no envio.
- As entradas do catálogo sem suporte ou sem permissão falham de forma segura e não podem ser selecionadas.

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Configuração de provedores e seleção de modelos.
  </Card>
  <Card title="Acompanhamento de uso" href="/pt-BR/concepts/usage-tracking" icon="chart-line">
    Interfaces de uso e status do OpenClaw.
  </Card>
</CardGroup>
