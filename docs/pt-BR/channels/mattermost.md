---
read_when:
    - Configurando o Mattermost
    - Depuração do roteamento do Mattermost
sidebarTitle: Mattermost
summary: Configuração do bot do Mattermost e do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T14:58:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Status: plugin disponível para download (token do bot + eventos WebSocket). Há suporte a canais, canais privados, MDs em grupo e MDs. O Mattermost é uma plataforma auto-hospedável de mensagens para equipes ([mattermost.com](https://mattermost.com)).

## Instalação

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

<Steps>
  <Step title="Garanta que o plugin esteja disponível">
    Instale `@openclaw/mattermost` com o comando acima e reinicie o Gateway se ele já estiver em execução.
  </Step>
  <Step title="Crie um bot do Mattermost">
    Crie uma conta de bot no Mattermost, copie o **token do bot** e adicione o bot às equipes e aos canais que ele deve ler.
  </Step>
  <Step title="Copie a URL base">
    Copie a **URL base** do Mattermost (por exemplo, `https://chat.example.com`). Uma terminação `/api/v4` é removida automaticamente.
  </Step>
  <Step title="Configure o OpenClaw e inicie o Gateway">
    Configuração mínima:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Alternativa não interativa:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost auto-hospedado em um endereço privado/LAN/tailnet: as solicitações de saída para a API do Mattermost passam por uma proteção contra SSRF que bloqueia IPs privados e internos por padrão. Habilite explicitamente com `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (por conta: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Comandos de barra nativos

Os comandos de barra nativos são opcionais. Quando habilitados, o OpenClaw registra comandos de barra `oc_*` em todas as equipes das quais o bot participa e recebe POSTs de callback no servidor HTTP do Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use quando o Mattermost não puder acessar o Gateway diretamente (proxy reverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Comandos registrados: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Com `nativeSkills: true`, os comandos de Skills também são registrados como `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Observações sobre o comportamento">
    - `native` e `nativeSkills` têm como padrão `"auto"`, que é interpretado como desabilitado para o Mattermost. Defina-os explicitamente como `true`.
    - O padrão de `callbackPath` é `/api/channels/mattermost/command`.
    - Se `callbackUrl` for omitido, o OpenClaw deriva `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Hosts de vinculação curinga (`0.0.0.0`, `::`) usam `localhost` como alternativa.
    - Em configurações com várias contas, `commands` pode ser definido no nível superior ou em `channels.mattermost.accounts.<id>.commands` (os valores da conta substituem os campos do nível superior).
    - Comandos de barra existentes com o mesmo acionador, criados por outras integrações, permanecem intactos (o registro os ignora); os comandos criados pelo bot são atualizados ou recriados quando a URL de callback diverge.
    - Os callbacks de comandos são validados com os tokens específicos de cada comando retornados pelo Mattermost quando o OpenClaw registra comandos `oc_*`.
    - O OpenClaw atualiza o registro atual dos comandos do Mattermost antes de aceitar cada callback; assim, tokens obsoletos de comandos de barra excluídos ou gerados novamente deixam de ser aceitos sem reiniciar o Gateway.
    - A validação do callback falha de forma fechada se a API do Mattermost não puder confirmar que o comando ainda é atual; as validações com falha são armazenadas brevemente em cache, as consultas simultâneas são agrupadas e o início de novas consultas tem limitação de taxa por comando para restringir a pressão de repetição.
    - Os callbacks de barra falham de forma fechada quando o registro falha, a inicialização é parcial ou o token do callback não corresponde ao token registrado do comando resolvido (um token válido para um comando não pode alcançar a validação upstream de outro comando).
    - Os callbacks aceitos são confirmados com uma resposta efêmera "Processando..."; a resposta real chega como uma mensagem normal.

  </Accordion>
  <Accordion title="Requisito de acessibilidade">
    O endpoint de callback deve estar acessível pelo servidor do Mattermost.

    - Não defina `callbackUrl` como `localhost`, a menos que o Mattermost seja executado no mesmo host/namespace de rede que o OpenClaw.
    - Não defina `callbackUrl` como a URL base do Mattermost, a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenClaw.
    - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; uma solicitação GET deve retornar `405 Method Not Allowed` do OpenClaw, não `404`.

  </Accordion>
  <Accordion title="Lista de permissões de saída do Mattermost">
    Se o destino do callback usar endereços privados/tailnet/internos, defina `ServiceSettings.AllowedUntrustedInternalConnections` no Mattermost para incluir o host/domínio do callback.

    Use entradas de host/domínio, não URLs completas.

    - Correto: `gateway.tailnet-name.ts.net`
    - Incorreto: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente (conta padrão)

Defina estas variáveis no host do Gateway se preferir usar variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
As variáveis de ambiente se aplicam somente à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

`MATTERMOST_URL` não pode ser definida por um arquivo `.env` do workspace; consulte [Arquivos .env do workspace](/pt-BR/gateway/security).
</Note>

## Modos de chat

O Mattermost responde automaticamente às MDs. O comportamento nos canais é controlado por `chatmode`:

<Tabs>
  <Tab title="oncall (padrão)">
    Responde somente quando recebe uma @menção nos canais.
  </Tab>
  <Tab title="onmessage">
    Responde a todas as mensagens do canal.
  </Tab>
  <Tab title="onchar">
    Responde quando uma mensagem começa com um prefixo acionador.
  </Tab>
</Tabs>

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // padrão
    },
  },
}
```

Observações:

- `onchar` ainda responde a @menções explícitas.
- `channels.mattermost.requireMention` continua sendo respeitado, mas `chatmode` é preferencial. As configurações `groups.<channelId>.requireMention` por canal têm precedência sobre ambos.
- Depois que o bot envia uma resposta visível em uma thread de canal, as mensagens posteriores nessa mesma thread são respondidas sem uma nova @menção ou prefixo `onchar`, permitindo que as conversas em thread com vários turnos continuem fluindo. A participação é lembrada por 7 dias após a última resposta do bot nessa thread e persiste após reinicializações do Gateway. Threads que o bot apenas observou não são afetadas; inicie uma nova mensagem de nível superior para voltar a exigir uma menção explícita.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se as respostas em canais e grupos permanecem no canal principal ou iniciam uma thread sob a publicação que as acionou.

- `off` (padrão): responde em uma thread somente quando a publicação recebida já estiver em uma.
- `first`: para publicações de nível superior em canais/grupos, inicia uma thread sob essa publicação e encaminha a conversa para uma sessão com escopo de thread.
- `all` e `batched`: atualmente têm o mesmo comportamento que `first` no Mattermost, pois, depois que o Mattermost tem uma raiz de thread, os fragmentos e as mídias subsequentes continuam nessa mesma thread.
- As mensagens diretas usam `off` por padrão, mesmo quando `replyToMode` está definido.

Use `channels.mattermost.replyToModeByChatType` para substituir o modo em chats `direct`, `group` ou `channel`. Defina `direct` para habilitar threads nas mensagens diretas:

- `off` (padrão): as mensagens diretas permanecem sem threads em uma única sessão contínua.
- `first`, `all` ou `batched`: cada mensagem direta de nível superior inicia uma thread do Mattermost associada a uma sessão nova e independente.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Observações:

- As sessões com escopo de thread usam o ID da publicação que as acionou como raiz da thread.
- `first` e `all` são equivalentes no momento, pois, depois que o Mattermost tem uma raiz de thread, os fragmentos e as mídias subsequentes continuam nessa mesma thread.
- As substituições por tipo de chat têm precedência sobre `replyToMode`. Sem uma substituição para `direct`, as implantações existentes mantêm as MDs planas, sem threads.

## Controle de acesso (MDs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento). Outros valores: `allowlist`, `open`, `disabled`.
- Aprove por meio de:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- MDs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]` (o esquema de configuração exige o curinga).
- `channels.mattermost.allowFrom` aceita IDs de usuários (recomendado) e entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (exige menção).
- Autorize remetentes com `channels.mattermost.groupAllowFrom` (IDs de usuários recomendados).
- `channels.mattermost.groupAllowFrom` aceita entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).
- As substituições de menção por canal ficam em `channels.mattermost.groups.<channelId>.requireMention` ou `channels.mattermost.groups["*"].requireMention` para definir um padrão.
- A correspondência por `@username` é mutável e só é habilitada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (exige menção).
- Ordem de resolução: `channels.mattermost.groupPolicy`, depois `channels.defaults.groupPolicy` e, por fim, `"allowlist"`.
- Observação de runtime: se a seção `channels.mattermost` estiver completamente ausente, o runtime falhará de forma fechada usando `groupPolicy="allowlist"` nas verificações de grupos (mesmo que `channels.defaults.groupPolicy` esteja definido) e registrará um aviso uma única vez.

Exemplo:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinos para entrega de saída

Use estes formatos de destino com `openclaw message send` ou cron/webhooks:

| Destino                             | Entrega em                                                          |
| ----------------------------------- | ------------------------------------------------------------------- |
| `channel:<id>`                      | Canal por ID                                                        |
| `channel:<name>` ou `#channel-name` | Canal por nome, pesquisado nas equipes às quais o bot pertence      |
| `user:<id>` ou `mattermost:<id>`    | MD com esse usuário                                                 |
| `@username`                         | MD (nome de usuário resolvido por meio da API do Mattermost)        |

Os envios de saída aceitam no máximo um anexo por mensagem; divida vários arquivos em envios separados.

<Warning>
IDs opacos sem prefixo (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário ou ID de canal).

O OpenClaw os resolve **priorizando o usuário**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` for bem-sucedido), o OpenClaw enviará uma **MD** resolvendo o canal direto por meio de `/api/v4/channels/direct`.
- Caso contrário, o ID será tratado como um **ID de canal**.

Se precisar de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Nova tentativa do canal de MD

Quando o OpenClaw envia para um destino de MD do Mattermost e precisa primeiro resolver o canal direto, ele repete por padrão as tentativas após falhas transitórias na criação do canal direto.

Use `channels.mattermost.dmChannelRetry` para ajustar esse comportamento globalmente para o plugin do Mattermost ou `channels.mattermost.accounts.<id>.dmChannelRetry` para uma conta. Padrões:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Observações:

- Isso se aplica apenas à criação de canais de MD (`/api/v4/channels/direct`), não a todas as chamadas à API do Mattermost.
- As novas tentativas usam recuo exponencial com variação aleatória e se aplicam a falhas transitórias, como limites de taxa, respostas 5xx e erros de rede ou de tempo limite.
- Erros 4xx do cliente diferentes de `429` são tratados como permanentes e não são repetidos.

## Streaming de pré-visualização

O Mattermost transmite o raciocínio, a atividade de ferramentas e o texto parcial da resposta para uma **publicação de pré-visualização em rascunho**, que é finalizada no próprio local quando é seguro enviar a resposta final. No modo `partial`, a pré-visualização é atualizada na mesma ID de publicação, em vez de inundar o canal com mensagens para cada fragmento. No modo `block`, a pré-visualização alterna entre blocos de texto concluído e de atividade de ferramentas, de modo que os blocos anteriores permaneçam visíveis como publicações próprias, em vez de serem sobrescritos pelo bloco seguinte. Resultados finais com mídia/erro cancelam as edições de pré-visualização pendentes e usam a entrega normal, em vez de concluir uma publicação de pré-visualização descartável.

O streaming de pré-visualização fica **ativado por padrão** no modo `partial`. Configure por meio de `channels.mattermost.streaming` (uma string de modo, um booleano ou um objeto como `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modos de streaming">
    - `partial` (padrão): uma publicação de pré-visualização que é editada à medida que a resposta cresce e depois finalizada com a resposta completa.
    - `block` alterna a pré-visualização entre blocos de texto concluído e de atividade de ferramentas, de modo que cada bloco permaneça visível como sua própria publicação, em vez de ser sobrescrito no próprio local. Atualizações paralelas e consecutivas de ferramentas compartilham a publicação atual de atividade de ferramentas.
    - `progress` exibe uma pré-visualização de status durante a geração e publica a resposta final somente após a conclusão.
    - `off` desativa o streaming de pré-visualização. Com `blockStreaming: true`, os blocos concluídos do assistente ainda são entregues como respostas normais em blocos (publicações separadas), em vez de uma única publicação final consolidada.

  </Accordion>
  <Accordion title="Observações sobre o comportamento do streaming">
    - Se o fluxo não puder ser finalizado no próprio local (por exemplo, se a publicação tiver sido excluída durante o streaming), o OpenClaw recorre ao envio de uma nova publicação final para que a resposta nunca seja perdida.
    - Cargas contendo apenas raciocínio são suprimidas das publicações do canal, incluindo texto recebido como uma citação em bloco `> Thinking`. Defina `/reasoning on` para ver o raciocínio em outras superfícies; a publicação final do Mattermost mantém apenas a resposta.
    - Consulte [Streaming](/pt-BR/concepts/streaming#preview-streaming-modes) para ver a matriz de mapeamento de canais.

  </Accordion>
</AccordionGroup>

## Reações (ferramenta de mensagens)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é a ID da publicação do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (os dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adição/remoção de reações são encaminhados como eventos do sistema para a sessão roteada do agente, sujeitos às mesmas verificações de política de MD/grupo aplicadas às mensagens.

Exemplos:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuração:

- `channels.mattermost.actions.reactions`: ativa/desativa ações de reação (padrão: true).
- Substituição por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botões interativos (ferramenta de mensagens)

Envie mensagens com botões clicáveis. Quando um usuário clica em um botão, o agente recebe a seleção e pode responder.

Os botões vêm da carga semântica `presentation` (em respostas normais do agente e em `message action=send`). O OpenClaw renderiza botões de valor como botões interativos do Mattermost, mantém botões de URL visíveis no texto da mensagem e rebaixa menus de seleção para texto legível.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Sim","value":"yes"},{"label":"Não","value":"no"}]}]}
```

Campos de botão da apresentação:

<ParamField path="label" type="string" required>
  Rótulo de exibição (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valor enviado de volta ao clicar, usado como ID da ação (aliases: `callback_data`, `callbackData`). Obrigatório para um botão clicável, a menos que `url` esteja definido.
</ParamField>
<ParamField path="url" type="string">
  Botão de link; renderizado como texto `label: url` no corpo da mensagem, em vez de um botão interativo.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Estilo do botão. O Mattermost aplica o estilo padrão aos valores que não oferece suporte.
</ParamField>

Para anunciar o suporte a botões no prompt de sistema do agente, adicione `inlineButtons` às capacidades do canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Quando um usuário clica em um botão:

<Steps>
  <Step title="Verificação de acesso">
    Quem clica deve passar pelas mesmas verificações de política de MD/grupo que o remetente de uma mensagem; cliques não autorizados recebem um aviso efêmero e são ignorados.
  </Step>
  <Step title="Botões substituídos por confirmação">
    Todos os botões são substituídos por uma linha de confirmação (por exemplo, "✓ **Sim** selecionado por @user").
  </Step>
  <Step title="O agente recebe a seleção">
    O agente recebe a seleção como uma mensagem de entrada (além de um evento do sistema) e responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações de implementação">
    - Os retornos de chamada dos botões usam verificação HMAC-SHA256 (automática, nenhuma configuração necessária).
    - Todo o bloco de anexo é substituído ao clicar, portanto todos os botões são removidos juntos — a remoção parcial não é possível.
    - IDs de ação que contêm hifens ou sublinhados são higienizados automaticamente (limitação de roteamento do Mattermost).
    - Cliques cujo `action_id` não corresponde a uma ação na publicação original são rejeitados com `403` ("Ação desconhecida").

  </Accordion>
  <Accordion title="Configuração e acessibilidade">
    - `channels.mattermost.capabilities`: matriz de strings de capacidades. Adicione `"inlineButtons"` para ativar a descrição da ferramenta de botões no prompt de sistema do agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para retornos de chamada de botões (por exemplo, `https://gateway.example.com`). Use isso quando o Mattermost não puder acessar diretamente o Gateway em seu host de vinculação.
    - Em configurações com várias contas, você também pode definir o mesmo campo em `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` for omitido, o OpenClaw deriva a URL de retorno de chamada de `gateway.customBindHost` + `gateway.port` (padrão: 18789) e depois recorre a `http://localhost:<port>`. O caminho de retorno de chamada é `/mattermost/interactions/<accountId>`.
    - Regra de acessibilidade: a URL de retorno de chamada do botão deve ser acessível pelo servidor Mattermost. `localhost` funciona somente quando o Mattermost e o OpenClaw são executados no mesmo host/espaço de nomes de rede.
    - `channels.mattermost.interactions.allowedSourceIps`: lista de permissões de IPs de origem para retornos de chamada de botões. Sem ela, somente origens de loopback (`127.0.0.1`, `::1`) são aceitas, portanto um servidor Mattermost remoto deve ser incluído na lista de permissões aqui ou seus cliques serão rejeitados com `403`. Atrás de um proxy reverso, defina também `gateway.trustedProxies` para que o IP real do cliente seja obtido dos cabeçalhos encaminhados.
    - Se o destino do retorno de chamada for privado/tailnet/interno, adicione o host/domínio dele a `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

  </Accordion>
</AccordionGroup>

### Integração direta com a API (scripts externos)

Scripts externos e webhooks podem publicar botões diretamente por meio da API REST do Mattermost, em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` do plugin quando possível; se publicar JSON bruto, siga estas regras:

**Estrutura da carga:**

```json5
{
  channel_id: "<channelId>",
  message: "Escolha uma opção:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // somente alfanumérico - veja abaixo
            type: "button", // obrigatório, ou os cliques são ignorados silenciosamente
            name: "Aprovar", // rótulo de exibição
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corresponder à ID do botão
                action: "approve",
                // ... quaisquer campos personalizados ...
                _token: "<hmac>", // consulte a seção sobre HMAC abaixo
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Regras críticas**

1. Os anexos ficam em `props.attachments`, não em `attachments` no nível superior (que é ignorado silenciosamente).
2. Toda ação precisa de `type: "button"` — sem isso, os cliques são descartados silenciosamente.
3. Toda ação precisa de um campo `id` — o Mattermost ignora ações sem IDs.
4. O `id` da ação deve ser **somente alfanumérico** (`[a-zA-Z0-9]`). Hifens e sublinhados interrompem o roteamento de ações no lado do servidor do Mattermost (retorna 404). Remova-os antes do uso.
5. `context.action_id` deve corresponder ao `id` do botão; o Gateway rejeita cliques cujo `action_id` não existe na publicação.
6. `context.action_id` é obrigatório — o manipulador de interações retorna 400 sem ele.
7. O IP de origem do retorno de chamada deve ser permitido (consulte `interactions.allowedSourceIps` acima).

</Warning>

**Geração do token HMAC**

O Gateway verifica cliques em botões com HMAC-SHA256. Scripts externos devem gerar tokens que correspondam à lógica de verificação do Gateway:

<Steps>
  <Step title="Derive o segredo do token do bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, codificado em hexadecimal.
  </Step>
  <Step title="Crie o objeto de contexto">
    Crie o objeto de contexto com todos os campos, **exceto** `_token`.
  </Step>
  <Step title="Serialize com chaves ordenadas">
    Serialize com **chaves ordenadas recursivamente** e **sem espaços** (o Gateway também canonicaliza objetos aninhados e produz JSON compacto).
  </Step>
  <Step title="Assine a carga">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Adicione o token">
    Adicione o resumo hexadecimal resultante como `_token` no contexto.
  </Step>
</Steps>

Exemplo em Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Armadilhas comuns de HMAC">
    - O `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
    - Sempre assine **todos** os campos de contexto (menos `_token`). O Gateway remove `_token` e depois assina tudo o que resta. Assinar um subconjunto causa uma falha silenciosa de verificação.
    - Use `sort_keys=True` — o Gateway ordena as chaves antes de assinar, e o Mattermost pode reordenar os campos de contexto ao armazenar a carga.
    - Derive o segredo do token do bot (de forma determinística), não de bytes aleatórios. O segredo deve ser o mesmo no processo que cria os botões e no Gateway que faz a verificação.

  </Accordion>
</AccordionGroup>

## Adaptador de diretório

O plugin do Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários por meio da API do Mattermost. Isso permite destinos `#channel-name` e `@username` em `openclaw message send` e em entregas de cron/webhook.

Nenhuma configuração é necessária — o adaptador usa o token do bot da configuração da conta.

## Várias contas

O Mattermost oferece suporte a várias contas em `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Principal", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alertas", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Os valores da conta substituem os campos de nível superior; `channels.mattermost.defaultAccount` seleciona qual conta será usada quando nenhuma for especificada.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas nos canais">
    Verifique se o bot está no canal e mencione-o (oncall), use um prefixo de acionamento (onchar) ou defina `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erros de autenticação ou de várias contas">
    - Verifique o token do bot, a URL base e se a conta está habilitada.
    - Problemas com várias contas: as variáveis de ambiente se aplicam apenas à conta `default`.
    - Hosts Mattermost privados ou na LAN precisam de `network.dangerouslyAllowPrivateNetwork: true` (a proteção contra SSRF bloqueia IPs privados por padrão).

  </Accordion>
  <Accordion title="Falha nos comandos de barra nativos">
    - `Unauthorized: invalid command token.`: o OpenClaw não aceitou o token de callback. Causas comuns:
      - o registro do comando de barra falhou ou foi concluído apenas parcialmente na inicialização
      - o callback está chegando ao Gateway ou à conta errada
      - o Mattermost ainda tem comandos antigos apontando para um destino de callback anterior
      - o Gateway foi reiniciado sem reativar os comandos de barra
    - Se os comandos de barra nativos pararem de funcionar, verifique nos logs se há `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` for omitido e os logs alertarem que o callback foi resolvido para uma URL de loopback como `http://localhost:18789/...`, essa URL provavelmente só poderá ser acessada quando o Mattermost estiver em execução no mesmo host ou namespace de rede que o OpenClaw. Em vez disso, defina explicitamente um `commands.callbackUrl` acessível externamente.

  </Accordion>
  <Accordion title="Problemas com botões">
    - Os botões aparecem como caixas brancas ou não aparecem: os dados do botão estão malformados. Cada botão de apresentação precisa de um `label` e um `value` (botões sem qualquer um deles são descartados).
    - Os botões são renderizados, mas os cliques não fazem nada: verifique se o Gateway está acessível pelo servidor Mattermost, se o IP do servidor Mattermost está incluído em `channels.mattermost.interactions.allowedSourceIps` (sem isso, apenas loopback é aceito) e se `ServiceSettings.AllowedUntrustedInternalConnections` inclui o host de callback para destinos privados.
    - Os botões retornam 404 ao serem clicados: o `id` do botão provavelmente contém hifens ou sublinhados. O roteador de ações do Mattermost falha com IDs não alfanuméricos. Use apenas `[a-zA-Z0-9]`.
    - O Gateway registra `rejected callback source`: o clique veio de um IP fora de `interactions.allowedSourceIps`. Adicione o servidor Mattermost ou seu ponto de entrada à lista de permissões e defina `gateway.trustedProxies` quando estiver atrás de um proxy reverso.
    - O Gateway registra `invalid _token`: incompatibilidade de HMAC. Verifique se você assina todos os campos de contexto (não apenas um subconjunto), usa chaves ordenadas e usa JSON compacto (sem espaços). Consulte a seção sobre HMAC acima.
    - O Gateway registra `missing _token in context`: o campo `_token` não está no contexto do botão. Verifique se ele está incluído ao criar o payload da integração.
    - O Gateway rejeita o clique com `Unknown action`: `context.action_id` não corresponde a nenhum `id` de ação na publicação. Defina ambos com o mesmo valor sanitizado.
    - O agente não oferece botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) - comportamento do chat em grupo e controle por menções
- [Pareamento](/pt-BR/channels/pairing) - autenticação por mensagem direta e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
