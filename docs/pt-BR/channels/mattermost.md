---
read_when:
    - Configurando o Mattermost
    - Depuração do roteamento do Mattermost
sidebarTitle: Mattermost
summary: Configuração do bot do Mattermost e do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-16T12:13:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e7d2233e26c6c0a510a264001a1e0d3e528d8645ffbe2affa3f1672304185ef5
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin disponível para download (token do bot + eventos WebSocket). Há suporte a canais, canais privados, DMs em grupo e DMs. O Mattermost é uma plataforma auto-hospedável de mensagens para equipes ([mattermost.com](https://mattermost.com)).

## Instalação

<Tabs>
  <Tab title="Registro npm">
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
  <Step title="Verifique se o Plugin está disponível">
    Instale `@openclaw/mattermost` com o comando acima e reinicie o Gateway caso ele já esteja em execução.
  </Step>
  <Step title="Crie um bot do Mattermost">
    Crie uma conta de bot no Mattermost, copie o **token do bot** e adicione o bot às equipes e aos canais que ele deve ler.
  </Step>
  <Step title="Copie a URL base">
    Copie a **URL base** do Mattermost (por exemplo, `https://chat.example.com`). Uma `/api/v4` ao final é removida automaticamente.
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

Os comandos de barra nativos são opcionais. Quando ativados, o OpenClaw registra comandos de barra `oc_*` em todas as equipes das quais o bot participa e recebe POSTs de callback no servidor HTTP do Gateway.

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
    - `native` e `nativeSkills` usam `"auto"` por padrão, que resulta em desativado para o Mattermost. Defina-os explicitamente como `true`.
    - `callbackPath` usa `/api/channels/mattermost/command` por padrão.
    - Se `callbackUrl` for omitido, o OpenClaw deriva `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Hosts de vinculação curinga (`0.0.0.0`, `::`) recorrem a `localhost`.
    - Em configurações com várias contas, `commands` pode ser definido no nível superior ou em `channels.mattermost.accounts.<id>.commands` (os valores da conta substituem os campos do nível superior).
    - Comandos de barra existentes com o mesmo acionador, criados por outras integrações, permanecem intactos (o registro os ignora); os comandos criados pelo bot são atualizados ou recriados quando a URL de callback diverge.
    - Os callbacks de comando são validados com os tokens específicos de cada comando retornados pelo Mattermost quando o OpenClaw registra comandos `oc_*`.
    - O OpenClaw atualiza o registro atual dos comandos do Mattermost antes de aceitar cada callback; assim, tokens obsoletos de comandos de barra excluídos ou regenerados deixam de ser aceitos sem que seja necessário reiniciar o Gateway.
    - A validação do callback falha de forma fechada se a API do Mattermost não puder confirmar que o comando ainda é atual; as validações com falha são armazenadas brevemente em cache, as consultas simultâneas são consolidadas e o início de novas consultas tem limitação de frequência por comando para restringir a pressão de repetição.
    - Os callbacks de barra falham de forma fechada quando o registro falhou, a inicialização foi parcial ou o token do callback não corresponde ao token registrado do comando resolvido (um token válido para um comando não pode alcançar a validação upstream de outro comando).
    - Os callbacks aceitos são confirmados com uma resposta efêmera "Processando..."; a resposta real chega como uma mensagem normal.

  </Accordion>
  <Accordion title="Requisito de acessibilidade">
    O endpoint de callback deve estar acessível pelo servidor do Mattermost.

    - Não defina `callbackUrl` como `localhost`, a menos que o Mattermost seja executado no mesmo host/namespace de rede que o OpenClaw.
    - Não defina `callbackUrl` como a URL base do Mattermost, a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenClaw.
    - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; uma solicitação GET deve retornar `405 Method Not Allowed` do OpenClaw, e não `404`.

  </Accordion>
  <Accordion title="Lista de permissões de saída do Mattermost">
    Se o callback apontar para endereços privados/tailnet/internos, defina `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost para incluir o host/domínio do callback.

    Use entradas de host/domínio, não URLs completas.

    - Correto: `gateway.tailnet-name.ts.net`
    - Incorreto: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente (conta padrão)

Defina-as no host do Gateway se preferir variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
As variáveis de ambiente se aplicam somente à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

`MATTERMOST_URL` não pode ser definido por meio de um `.env` do workspace; consulte [Arquivos .env do workspace](/pt-BR/gateway/security).
</Note>

## Modos de chat

O Mattermost responde automaticamente às DMs. O comportamento nos canais é controlado por `chatmode`:

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
- `channels.mattermost.requireMention` ainda é respeitado, mas `chatmode` é preferível. As configurações `groups.<channelId>.requireMention` por canal prevalecem sobre ambos.
- Depois que o bot envia uma resposta visível em uma thread de canal, as mensagens posteriores nessa mesma thread são respondidas sem uma nova @menção ou prefixo `onchar`, permitindo que as conversas de vários turnos na thread continuem fluindo. A participação é lembrada por 7 dias após a última resposta do bot nessa thread e persiste após reinicializações do Gateway. Threads que o bot apenas observou não são afetadas; inicie uma nova mensagem no nível superior para voltar a exigir uma menção explícita.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se as respostas em canais e grupos permanecem no canal principal ou iniciam uma thread sob a publicação acionadora.

- `off` (padrão): responde em uma thread somente quando a publicação recebida já está em uma.
- `first`: para publicações de canal/grupo no nível superior, inicia uma thread sob essa publicação e encaminha a conversa para uma sessão com escopo de thread.
- `all` e `batched`: atualmente têm o mesmo comportamento que `first` no Mattermost, pois, depois que o Mattermost tem uma raiz de thread, os trechos e as mídias subsequentes continuam nessa mesma thread.
- As mensagens diretas usam `off` por padrão, mesmo quando `replyToMode` está definido.

Use `channels.mattermost.replyToModeByChatType` para substituir o modo em conversas `direct`, `group` ou `channel`. Defina `direct` para habilitar threads em mensagens diretas:

- `off` (padrão): as mensagens diretas permanecem sem threads em uma única sessão contínua.
- `first`, `all` ou `batched`: cada mensagem direta no nível superior inicia uma thread do Mattermost respaldada por uma sessão nova e independente.

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

- As sessões com escopo de thread usam o ID da publicação acionadora como raiz da thread.
- `first` e `all` são atualmente equivalentes porque, depois que o Mattermost tem uma raiz de thread, os trechos e as mídias subsequentes continuam nessa mesma thread.
- As substituições por tipo de conversa prevalecem sobre `replyToMode`. Sem uma substituição `direct`, as implantações existentes mantêm DMs lineares, sem threads.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento). Outros valores: `allowlist`, `open`, `disabled`.
- Aprove por meio de:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]` (o esquema de configuração exige o curinga).
- `channels.mattermost.allowFrom` aceita IDs de usuário (recomendado) e entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (exige menção).
- Inclua remetentes na lista de permissões com `channels.mattermost.groupAllowFrom` (recomenda-se usar IDs de usuário).
- `channels.mattermost.groupAllowFrom` aceita entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).
- As substituições de menção por canal ficam em `channels.mattermost.groups.<channelId>.requireMention` ou em `channels.mattermost.groups["*"].requireMention` para um padrão.
- A correspondência de `@username` é mutável e só é ativada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (exige menção).
- Ordem de resolução: `channels.mattermost.groupPolicy`, depois `channels.defaults.groupPolicy` e, por fim, `"allowlist"`.
- Observação de runtime: se a seção `channels.mattermost` estiver completamente ausente, o runtime falhará de forma fechada usando `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido) e registrará um aviso uma única vez.

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

| Destino                              | Entrega em                                                               |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `channel:<id>`                      | Canal por ID                                                             |
| `channel:<name>` ou `#channel-name` | Canal por nome, pesquisado entre as equipes das quais o bot participa    |
| `user:<id>` ou `mattermost:<id>`    | DM com esse usuário                                                      |
| `@username`                         | DM (nome de usuário resolvido pela API do Mattermost)                    |

Os envios de saída aceitam no máximo um anexo por mensagem; divida vários arquivos em envios separados.

<Warning>
IDs opacos sem prefixo (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário ou ID de canal).

O OpenClaw os resolve **priorizando o usuário**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` for bem-sucedido), o OpenClaw enviará uma **DM** resolvendo o canal direto por meio de `/api/v4/channels/direct`.
- Caso contrário, o ID será tratado como um **ID de canal**.

Se precisar de um comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Nova tentativa do canal de DM

Quando o OpenClaw envia para um destino de MD do Mattermost e precisa primeiro resolver o canal direto, por padrão ele tenta novamente em caso de falhas transitórias na criação do canal direto.

Use `channels.mattermost.dmChannelRetry` para ajustar esse comportamento globalmente para o Plugin do Mattermost ou `channels.mattermost.accounts.<id>.dmChannelRetry` para uma conta. Padrões:

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

- Isso se aplica somente à criação de canais de MD (`/api/v4/channels/direct`), não a todas as chamadas à API do Mattermost.
- As novas tentativas usam espera exponencial com jitter e se aplicam a falhas transitórias, como limites de taxa, respostas 5xx e erros de rede ou de tempo limite.
- Erros 4xx do cliente diferentes de `429` são tratados como permanentes e não são tentados novamente.

## Streaming de pré-visualização

O Mattermost transmite o raciocínio, a atividade das ferramentas e o texto parcial da resposta para uma **publicação de pré-visualização em rascunho**, que é finalizada no mesmo lugar quando é seguro enviar a resposta final. No modo `partial`, a pré-visualização é atualizada com o mesmo ID de publicação, em vez de inundar o canal com mensagens para cada fragmento. No modo `block`, a pré-visualização alterna entre o texto concluído e os blocos de atividade das ferramentas, de modo que os blocos anteriores permaneçam visíveis como publicações próprias, em vez de serem sobrescritos pelo bloco seguinte. Respostas finais com mídia/erro cancelam as edições pendentes da pré-visualização e usam a entrega normal, em vez de efetivar uma publicação de pré-visualização descartável.

O streaming de pré-visualização fica **ativado por padrão** no modo `partial`. Configure por meio de `channels.mattermost.streaming.mode` (valores escalares/booleanos legados de `streaming` são migrados por `openclaw doctor --fix`):

```json5
{
  channels: {
    mattermost: {
      streaming: { mode: "partial" }, // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modos de streaming">
    - `partial` (padrão): uma publicação de pré-visualização que é editada à medida que a resposta aumenta e, em seguida, finalizada com a resposta completa.
    - `block` alterna a pré-visualização entre o texto concluído e os blocos de atividade das ferramentas, de modo que cada bloco permaneça visível como uma publicação própria, em vez de ser sobrescrito no mesmo lugar. Atualizações de ferramentas paralelas e consecutivas compartilham a publicação atual de atividade das ferramentas.
    - `progress` mostra uma pré-visualização de status durante a geração e publica a resposta final somente após a conclusão.
    - `off` desativa o streaming de pré-visualização. Com `streaming.block.enabled: true`, os blocos concluídos do assistente ainda são entregues como respostas normais em blocos (publicações separadas), em vez de uma única publicação final consolidada.

  </Accordion>
  <Accordion title="Observações sobre o comportamento do streaming">
    - Se o stream não puder ser finalizado no mesmo lugar (por exemplo, se a publicação for excluída durante o stream), o OpenClaw recorre ao envio de uma nova publicação final para que a resposta nunca seja perdida.
    - Cargas contendo somente raciocínio são suprimidas das publicações do canal, incluindo texto que chega como uma citação em bloco `> Thinking`. Defina `/reasoning on` para ver o raciocínio em outras superfícies; a publicação final do Mattermost mantém somente a resposta.
    - Consulte [Streaming](/pt-BR/concepts/streaming#preview-streaming-modes) para ver a matriz de mapeamento dos canais.

  </Accordion>
</AccordionGroup>

## Reações (ferramenta de mensagens)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o ID da publicação do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (os dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Os eventos de adição/remoção de reações são encaminhados como eventos de sistema para a sessão roteada do agente, sujeitos às mesmas verificações de política de MD/grupo aplicadas às mensagens.

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

Os botões vêm da carga semântica `presentation` (em respostas normais do agente e em `message action=send`). O OpenClaw renderiza botões de valor como botões interativos do Mattermost, mantém botões de URL visíveis no texto da mensagem e converte menus de seleção em texto legível.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Campos dos botões da apresentação:

<ParamField path="label" type="string" required>
  Rótulo exibido (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valor retornado ao clicar, usado como ID da ação (aliases: `callback_data`, `callbackData`). Obrigatório para um botão clicável, a menos que `url` esteja definido.
</ParamField>
<ParamField path="url" type="string">
  Botão de link; renderizado como texto `label: url` no corpo da mensagem, em vez de um botão interativo.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Estilo do botão. O Mattermost aplica o estilo padrão a valores não compatíveis.
</ParamField>

Para anunciar a compatibilidade com botões no prompt de sistema do agente, adicione `inlineButtons` aos recursos do canal:

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
    Quem clicou deve passar pelas mesmas verificações de política de MD/grupo aplicadas ao remetente de uma mensagem; cliques não autorizados recebem uma notificação efêmera e são ignorados.
  </Step>
  <Step title="Botões substituídos por confirmação">
    Todos os botões são substituídos por uma linha de confirmação (por exemplo, "✓ **Sim** selecionado por @user").
  </Step>
  <Step title="O agente recebe a seleção">
    O agente recebe a seleção como uma mensagem de entrada (além de um evento de sistema) e responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações sobre a implementação">
    - Os retornos de chamada dos botões usam verificação HMAC-SHA256 (automática, nenhuma configuração necessária).
    - Todo o bloco de anexo é substituído ao clicar, portanto todos os botões são removidos juntos — não é possível removê-los parcialmente.
    - IDs de ação contendo hifens ou sublinhados são higienizados automaticamente (limitação de roteamento do Mattermost).
    - Cliques cujo `action_id` não corresponde a uma ação na publicação original são rejeitados com `403` ("Ação desconhecida").

  </Accordion>
  <Accordion title="Configuração e acessibilidade">
    - `channels.mattermost.capabilities`: matriz de strings de recursos. Adicione `"inlineButtons"` para ativar a descrição da ferramenta de botões no prompt de sistema do agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para retornos de chamada dos botões (por exemplo, `https://gateway.example.com`). Use-a quando o Mattermost não puder acessar o Gateway diretamente no host de associação.
    - Em configurações com várias contas, também é possível definir o mesmo campo em `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` for omitido, o OpenClaw deriva a URL de retorno de chamada de `gateway.customBindHost` + `gateway.port` (padrão: 18789) e, em seguida, recorre a `http://localhost:<port>`. O caminho do retorno de chamada é `/mattermost/interactions/<accountId>`.
    - Regra de acessibilidade: a URL de retorno de chamada do botão deve ser acessível pelo servidor Mattermost. `localhost` funciona somente quando o Mattermost e o OpenClaw são executados no mesmo host/namespace de rede.
    - `channels.mattermost.interactions.allowedSourceIps`: lista de permissões de IPs de origem para retornos de chamada dos botões. Sem ela, somente origens de loopback (`127.0.0.1`, `::1`) são aceitas; portanto, um servidor Mattermost remoto deve ser incluído nessa lista, caso contrário seus cliques serão rejeitados com `403`. Atrás de um proxy reverso, defina também `gateway.trustedProxies` para que o IP real do cliente seja derivado dos cabeçalhos encaminhados.
    - Se o destino do retorno de chamada for privado/da tailnet/interno, adicione seu host/domínio a `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

  </Accordion>
</AccordionGroup>

### Integração direta com a API (scripts externos)

Scripts externos e webhooks podem publicar botões diretamente por meio da API REST do Mattermost, em vez de passar pela ferramenta `message` do agente. Prefira a ferramenta `message` do OpenClaw. Para integrações diretas, importe `buildButtonAttachments` de `@openclaw/mattermost/api.js`; ao publicar JSON bruto, siga estas regras:

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
            type: "button", // obrigatório, caso contrário os cliques são ignorados silenciosamente
            name: "Aprovar", // rótulo de exibição
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corresponder ao ID do botão
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

1. Os anexos ficam em `props.attachments`, não no `attachments` de nível superior (ignorado silenciosamente).
2. Cada ação precisa de `type: "button"` — sem isso, os cliques são descartados silenciosamente.
3. Cada ação precisa de um campo `id` — o Mattermost ignora ações sem IDs.
4. O `id` da ação deve ser **somente alfanumérico** (`[a-zA-Z0-9]`). Hifens e sublinhados interrompem o roteamento de ações no servidor do Mattermost (retorna 404). Remova-os antes do uso.
5. `context.action_id` deve corresponder ao `id` do botão; o Gateway rejeita cliques cujo `action_id` não existe na publicação.
6. `context.action_id` é obrigatório — o manipulador de interações retorna 400 sem ele.
7. O IP de origem do retorno de chamada deve ser permitido (consulte `interactions.allowedSourceIps` acima).

</Warning>

**Geração do token HMAC**

O Gateway verifica os cliques nos botões com HMAC-SHA256. Scripts externos devem gerar tokens que correspondam à lógica de verificação do Gateway:

<Steps>
  <Step title="Derive o segredo do token do bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, codificado em hexadecimal.
  </Step>
  <Step title="Crie o objeto de contexto">
    Crie o objeto de contexto com todos os campos, **exceto** `_token`.
  </Step>
  <Step title="Serialize com as chaves ordenadas">
    Serialize com **chaves ordenadas recursivamente** e **sem espaços** (o Gateway também canoniza objetos aninhados e produz JSON compacto).
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
    - Sempre assine **todos** os campos de contexto (exceto `_token`). O Gateway remove `_token` e, em seguida, assina tudo o que resta. Assinar apenas um subconjunto causa uma falha silenciosa na verificação.
    - Use `sort_keys=True` — o Gateway ordena as chaves antes de assinar, e o Mattermost pode reordenar os campos de contexto ao armazenar o payload.
    - Derive o segredo do token do bot (de forma determinística), não de bytes aleatórios. O segredo deve ser o mesmo no processo que cria os botões e no Gateway que faz a verificação.

  </Accordion>
</AccordionGroup>

## Adaptador de diretório

O plugin do Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários por meio da API do Mattermost. Isso habilita destinos `#channel-name` e `@username` em entregas de `openclaw message send` e cron/webhook.

Nenhuma configuração é necessária — o adaptador usa o token do bot da configuração da conta.

## Várias contas

O Mattermost oferece suporte a várias contas em `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Os valores da conta substituem os campos de nível superior; `channels.mattermost.defaultAccount` seleciona qual conta é usada quando nenhuma é especificada.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Nenhuma resposta nos canais">
    Verifique se o bot está no canal e mencione-o (oncall), use um prefixo de acionamento (onchar) ou defina `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erros de autenticação ou de várias contas">
    - Verifique o token do bot, a URL base e se a conta está habilitada.
    - Problemas com várias contas: as variáveis de ambiente se aplicam somente à conta `default`.
    - Hosts privados/LAN do Mattermost precisam de `network.dangerouslyAllowPrivateNetwork: true` (a proteção contra SSRF bloqueia IPs privados por padrão).

  </Accordion>
  <Accordion title="Falha nos comandos de barra nativos">
    - `Unauthorized: invalid command token.`: o OpenClaw não aceitou o token de callback. Causas comuns:
      - o registro do comando de barra falhou ou foi concluído apenas parcialmente na inicialização
      - o callback está chegando ao Gateway ou à conta incorreta
      - o Mattermost ainda tem comandos antigos apontando para um destino de callback anterior
      - o Gateway foi reiniciado sem reativar os comandos de barra
    - Se os comandos de barra nativos pararem de funcionar, verifique nos logs a presença de `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` for omitido e os logs avisarem que o callback foi resolvido para uma URL de loopback como `http://localhost:18789/...`, essa URL provavelmente só poderá ser acessada quando o Mattermost estiver em execução no mesmo host/namespace de rede que o OpenClaw. Em vez disso, defina explicitamente um `commands.callbackUrl` acessível externamente.

  </Accordion>
  <Accordion title="Problemas com botões">
    - Os botões aparecem como caixas brancas ou não aparecem: os dados do botão estão malformados. Cada botão de apresentação precisa de um `label` e de um `value` (botões sem um deles são descartados).
    - Os botões são renderizados, mas os cliques não fazem nada: verifique se o Gateway pode ser acessado pelo servidor do Mattermost, se o IP do servidor do Mattermost está incluído em `channels.mattermost.interactions.allowedSourceIps` (sem essa configuração, apenas loopback é aceito) e se `ServiceSettings.AllowedUntrustedInternalConnections` inclui o host do callback para destinos privados.
    - Os botões retornam 404 ao serem clicados: o `id` do botão provavelmente contém hifens ou sublinhados. O roteador de ações do Mattermost falha com IDs que contêm caracteres não alfanuméricos. Use somente `[a-zA-Z0-9]`.
    - O Gateway registra `rejected callback source`: o clique veio de um IP fora de `interactions.allowedSourceIps`. Adicione o servidor do Mattermost ou seu ingresso à lista de permissões e defina `gateway.trustedProxies` quando estiver atrás de um proxy reverso.
    - O Gateway registra `invalid _token`: incompatibilidade de HMAC. Verifique se todos os campos de contexto estão sendo assinados (não apenas um subconjunto), use chaves ordenadas e JSON compacto (sem espaços). Consulte a seção sobre HMAC acima.
    - O Gateway registra `missing _token in context`: o campo `_token` não está no contexto do botão. Certifique-se de incluí-lo ao criar o payload da integração.
    - O Gateway rejeita o clique com `Unknown action`: `context.action_id` não corresponde a nenhum `id` de ação na publicação. Defina ambos com o mesmo valor sanitizado.
    - O agente não oferece botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal do Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionados

- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e controle por menção
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de emparelhamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
