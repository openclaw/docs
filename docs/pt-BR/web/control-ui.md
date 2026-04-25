---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso pela Tailnet sem túneis SSH
summary: Interface de controle baseada em navegador para o Gateway (chat, nodes, config)
title: Interface de controle
x-i18n:
    generated_at: "2026-04-25T13:58:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 270ef5de55aa3bd34b8e9dcdea9f8dbe0568539edc268c809d652b838e8f5219
    source_path: web/control-ui.md
    workflow: 15
---

A Interface de controle é um pequeno app de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie primeiro o Gateway: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão atual da aba do navegador
e a URL do gateway selecionada; senhas não são persistidas. O onboarding geralmente
gera um token do gateway para autenticação por segredo compartilhado na primeira conexão, mas
a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Interface de controle a partir de um novo navegador ou dispositivo, o Gateway
exige uma **aprovação de pareamento única** — mesmo se você estiver na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Esta é uma medida de segurança para evitar
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# Lista solicitações pendentes
openclaw devices list

# Aprova por ID da solicitação
openclaw devices approve <requestId>
```

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (papel/escopos/chave
pública), a solicitação pendente anterior é substituída e um novo `requestId` é
criado. Execute novamente `openclaw devices list` antes da aprovação.

Se o navegador já estiver pareado e você o alterar de acesso de leitura para
acesso de escrita/admin, isso será tratado como uma atualização de aprovação, não como uma
reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a
reconexão mais ampla e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos
que você revogue com `openclaw devices revoke --device <id> --role <role>`. Veja
[CLI de dispositivos](/pt-BR/cli/devices) para rotação de token e revogação.

**Observações:**

- Conexões diretas do navegador local por loopback (`127.0.0.1` / `localhost`) são
  aprovadas automaticamente.
- Conexões de navegador por Tailnet e LAN ainda exigem aprovação explícita, mesmo quando
  se originam da mesma máquina.
- Cada perfil de navegador gera um ID de dispositivo único, então trocar de navegador ou
  limpar os dados do navegador exigirá um novo pareamento.

## Identidade pessoal (local ao navegador)

A Interface de controle oferece suporte a uma identidade pessoal por navegador (nome de exibição e
avatar) anexada às mensagens enviadas para atribuição em sessões compartilhadas. Ela
fica no armazenamento do navegador, está limitada ao perfil atual do navegador e não é
sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais
de autoria do transcript nas mensagens que você realmente envia. Limpar os dados do site ou
trocar de navegador a redefine para vazio.

## Endpoint de configuração em runtime

A Interface de controle busca suas configurações de runtime em
`/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma
autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não
podem buscá-lo, e uma busca bem-sucedida exige um token/senha do gateway já válido,
identidade do Tailscale Serve ou identidade de proxy confiável.

## Suporte a idiomas

A Interface de controle pode se localizar na primeira carga com base no idioma do seu navegador.
Para substituí-lo depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O
seletor de localidade fica no cartão Acesso ao Gateway, não em Aparência.

- Localidades compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Traduções que não sejam em inglês são carregadas sob demanda no navegador.
- A localidade selecionada é salva no armazenamento do navegador e reutilizada em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

## O que ela pode fazer (hoje)

- Conversar com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Falar com o OpenAI Realtime diretamente do navegador via WebRTC. O Gateway
  gera um segredo de cliente Realtime de curta duração com `talk.realtime.session`; o
  navegador envia o áudio do microfone diretamente para a OpenAI e retransmite
  chamadas de ferramenta `openclaw_agent_consult` de volta por `chat.send` para o
  modelo maior configurado do OpenClaw.
- Transmitir chamadas de ferramenta + cartões de saída de ferramenta ao vivo no Chat (eventos do agente)
- Canais: status de canais integrados mais canais de Plugin incluídos/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: listar + substituições por sessão de modelo/raciocínio/rápido/verboso/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: status de Dreaming, alternância de habilitar/desabilitar e leitor do Diário de Sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Tarefas Cron: listar/adicionar/editar/executar/habilitar/desabilitar + histórico de execução (`cron.*`)
- Skills: status, habilitar/desabilitar, instalar, atualizações de chave de API (`skills.*`)
- Nodes: listar + capacidades (`node.list`)
- Aprovações de exec: editar allowlists do gateway ou do node + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`)
- Configuração: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuração: aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa
- Escritas de configuração incluem uma proteção de hash-base para evitar sobrescrever edições simultâneas
- Escritas de configuração (`config.set`/`config.apply`/`config.patch`) também fazem uma verificação prévia da resolução ativa de SecretRef para refs na carga de configuração enviada; refs ativas enviadas e não resolvidas são rejeitadas antes da gravação
- Esquema de configuração + renderização de formulário (`config.schema` / `config.schema.lookup`,
  incluindo campo `title` / `description`, dicas de UI correspondentes, resumos
  imediatos dos filhos, metadados de documentação em nós aninhados de objeto/coringa/array/composição,
  além de esquemas de Plugin + canal quando disponíveis); o editor Raw JSON fica
  disponível somente quando o snapshot tem um round-trip bruto seguro
- Se um snapshot não puder fazer round-trip com segurança no texto bruto, a Interface de controle força o modo Form e desabilita o modo Raw para esse snapshot
- O "Reset to saved" do editor Raw JSON preserva a forma criada em bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer round-trip com segurança
- Valores estruturados de objeto SecretRef são renderizados como somente leitura em entradas de texto do formulário para evitar corrupção acidental de objeto para string
- Depuração: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`)
- Logs: live tail de logs de arquivo do gateway com filtro/exportação (`logs.tail`)
- Atualização: executar uma atualização de pacote/git + reiniciar (`update.run`) com um relatório de reinicialização

Observações do painel de tarefas Cron:

- Para tarefas isoladas, a entrega usa por padrão anúncio de resumo. Você pode mudar para none se quiser execuções somente internas.
- Campos de canal/destino aparecem quando announce está selecionado.
- O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de Webhook HTTP(S) válida.
- Para tarefas da sessão principal, os modos de entrega webhook e none estão disponíveis.
- Os controles avançados de edição incluem delete-after-run, limpar substituição de agente, opções exatas/escalonadas de cron,
  substituições de modelo/raciocínio do agente e alternâncias de entrega por melhor esforço.
- A validação do formulário é inline com erros no nível de campo; valores inválidos desabilitam o botão de salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um bearer token dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
- Fallback obsoleto: tarefas legadas armazenadas com `notify: true` ainda podem usar `cron.webhook` até serem migradas.

## Comportamento do Chat

- `chat.send` é **não bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
- Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução e `{ status: "ok" }` após a conclusão.
- Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando entradas do transcript são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens superdimensionadas por um placeholder (`[chat.history omitted: message too large]`).
- Imagens geradas pelo assistente são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, então recarregamentos não dependem de cargas de imagem base64 brutas permanecerem na resposta de histórico do chat.
- `chat.history` também remove tags de diretiva inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), cargas XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), além de tokens de controle de modelo ASCII/largura total vazados, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
- Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém
  mensagens otimistas locais de usuário/assistente visíveis se `chat.history` retornar brevemente
  um snapshot mais antigo; o transcript canônico substitui essas mensagens locais assim que
  o histórico do Gateway alcança o estado atual.
- `chat.inject` anexa uma nota do assistente ao transcript da sessão e transmite um evento `chat` para atualizações somente de UI (sem execução de agente, sem entrega de canal).
- Os seletores de modelo e raciocínio do cabeçalho do chat aplicam patch na sessão ativa imediatamente por meio de `sessions.patch`; eles são substituições persistentes da sessão, não opções de envio válidas apenas para um turno.
- Quando relatórios recentes de uso de sessão do Gateway mostram alta pressão de contexto, a
  área do compositor do chat mostra um aviso de contexto e, nos níveis recomendados de
  Compaction, um botão de compactação que executa o caminho normal de compactação da sessão. Snapshots
  de token obsoletos ficam ocultos até que o Gateway relate novamente uso atualizado.
- O modo Talk usa um provedor de voz realtime registrado que oferece suporte a sessões WebRTC no navegador. Configure a OpenAI com `talk.provider: "openai"` mais
  `talk.providers.openai.apiKey`, ou reutilize a configuração do provedor realtime de Voice Call. O
  navegador nunca recebe a chave padrão da API da OpenAI; ele recebe
  apenas o segredo efêmero do cliente Realtime. A voz realtime Google Live é
  compatível para Voice Call de backend e bridges do Google Meet, mas ainda não para esse caminho
  WebRTC no navegador. O prompt da sessão Realtime é montado pelo Gateway;
  `talk.realtime.session` não aceita substituições de instruções fornecidas pelo chamador.
- No compositor do Chat, o controle Talk é o botão de ondas ao lado do
  botão de ditado do microfone. Quando o Talk é iniciado, a linha de status do compositor mostra
  `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou
  `Asking OpenClaw...` enquanto uma chamada de ferramenta realtime consulta o
  modelo maior configurado por `chat.send`.
- Parar:
  - Clique em **Stop** (chama `chat.abort`)
  - Enquanto uma execução estiver ativa, acompanhamentos normais entram na fila. Clique em **Steer** em uma mensagem enfileirada para injetar esse acompanhamento no turno em execução.
  - Digite `/stop` (ou frases de aborto autônomas como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda
  - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão
- Retenção parcial após aborto:
  - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI
  - O Gateway persiste texto parcial abortado do assistente no histórico do transcript quando existe saída em buffer
  - Entradas persistidas incluem metadados de aborto para que consumidores do transcript possam distinguir parciais abortados de saídas normais concluídas

## Instalação de PWA e web push

A Interface de controle inclui um `manifest.webmanifest` e um service worker, então
navegadores modernos podem instalá-la como uma PWA independente. O Web Push permite que o
Gateway desperte a PWA instalada com notificações mesmo quando a aba ou a
janela do navegador não estiver aberta.

| Superfície                                           | O que faz                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                     | Manifesto da PWA. Navegadores oferecem "Instalar app" quando ela está acessível. |
| `ui/public/sw.js`                                    | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (no diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar cargas de Web Push. |
| `push/web-push-subscriptions.json`                   | Endpoints de inscrição do navegador persistidos.                   |

Substitua o par de chaves VAPID por variáveis de ambiente no processo do Gateway quando
quiser fixar chaves (para implantações com vários hosts, rotação de segredos ou
testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `mailto:openclaw@localhost`)

A Interface de controle usa estes métodos do Gateway com escopo controlado para registrar e
testar inscrições do navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a inscrição do chamador.

O Web Push é independente do caminho de relay APNS do iOS
(veja [Configuração](/pt-BR/gateway/configuration) para push com relay) e
do método `push.test` existente, que tem como alvo o pareamento nativo em dispositivos móveis.

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`.
A política de sandbox do iframe é controlada por
`gateway.controlUi.embedSandbox`:

- `strict`: desativa a execução de scripts dentro de embeds hospedados
- `scripts`: permite embeds interativos mantendo o isolamento de origem; este é
  o padrão e normalmente é suficiente para jogos/widgets de navegador autocontidos
- `trusted`: adiciona `allow-same-origin` além de `allow-scripts` para documentos do mesmo site
  que intencionalmente precisam de privilégios mais fortes

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Use `trusted` apenas quando o documento embutido realmente precisar de
comportamento de mesma origem. Para a maioria dos jogos gerados por agente e canvas interativos, `scripts` é
a escolha mais segura.

URLs de embed externas absolutas `http(s)` continuam bloqueadas por padrão. Se você
intencionalmente quiser que `[embed url="https://..."]` carregue páginas de terceiros, defina
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acesso pela Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abra:

- `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

Por padrão, requisições Serve da Interface de controle/WebSocket podem autenticar via cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e comparando-o com o cabeçalho, e aceita isso apenas quando a
requisição atinge o loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado
mesmo para tráfego do Serve. Nesse caso, use `gateway.auth.mode: "token"` ou
`"password"`.
Para esse caminho assíncrono de identidade do Serve, tentativas de autenticação com falha para o mesmo IP de cliente
e escopo de autenticação são serializadas antes das gravações de limite de taxa. Repetições ruins concorrentes
do mesmo navegador podem, portanto, mostrar `retry later` na segunda requisição
em vez de duas incompatibilidades simples competindo em paralelo.
A autenticação Serve sem token assume que o host do gateway é confiável. Se código local não confiável
puder ser executado nesse host, exija autenticação por token/senha.

### Vincular à tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Depois, abra:

- `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` configurado)

Cole o segredo compartilhado correspondente nas configurações da UI (enviado como
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`),
o navegador será executado em um **contexto não seguro** e bloqueará o WebCrypto. Por padrão,
o OpenClaw **bloqueia** conexões da Interface de controle sem identidade do dispositivo.

Exceções documentadas:

- compatibilidade com HTTP inseguro somente em localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da Interface de controle do operador por `gateway.auth.mode: "trusted-proxy"`
- modo de emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

**Comportamento da opção insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` é apenas uma opção local de compatibilidade:

- Permite que sessões da Interface de controle em localhost prossigam sem identidade do dispositivo em
  contextos HTTP não seguros.
- Não ignora verificações de pareamento.
- Não flexibiliza requisitos remotos (não localhost) de identidade do dispositivo.

**Apenas para emergência:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desativa verificações de identidade de dispositivo da Interface de controle e é um
grave rebaixamento de segurança. Reverta rapidamente após uso emergencial.

Observação sobre trusted-proxy:

- autenticação bem-sucedida de trusted-proxy pode admitir sessões de **operador** da Interface de controle sem
  identidade do dispositivo
- isso **não** se estende a sessões da Interface de controle com papel de node
- proxies reversos em loopback no mesmo host ainda não satisfazem autenticação trusted-proxy; veja
  [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

Veja [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração de HTTPS.

## Política de Segurança de Conteúdo

A Interface de controle é fornecida com uma política `img-src` rígida: apenas recursos de **mesma origem**,
URLs `data:` e URLs `blob:` geradas localmente são permitidas. URLs de imagem remotas `http(s)` e com protocolo relativo são rejeitadas pelo navegador e não geram buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo `/avatars/<id>`) continuam sendo renderizados, incluindo rotas autenticadas de avatar que a UI busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` continuam sendo renderizadas (útil para cargas no próprio protocolo).
- URLs `blob:` locais criadas pela Interface de controle continuam sendo renderizadas.
- URLs remotas de avatar emitidas por metadados de canal são removidas nos helpers de avatar da Interface de controle e substituídas pelo logo/badge integrado, para que um canal comprometido ou malicioso não possa forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da Interface de controle exige o mesmo token do gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem de avatar apenas para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Requisições não autenticadas para qualquer uma das rotas são rejeitadas (em linha com a rota irmã de mídia do assistente). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estariam protegidos.
- A própria Interface de controle encaminha o token do gateway como cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem continue sendo renderizada nos dashboards.

Se você desabilitar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também se tornará não autenticada, em linha com o restante do gateway.

## Compilar a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quer URLs fixas de recursos):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Depois, aponte a UI para a URL WS do seu Gateway (por exemplo `ws://127.0.0.1:18789`).

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Interface de controle é composta por arquivos estáticos; o destino WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento do Vite
localmente, mas o Gateway está em execução em outro lugar.

1. Inicie o servidor de desenvolvimento da UI: `pnpm ui:dev`
2. Abra uma URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticação opcional de uso único (se necessário):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Observações:

- `gatewayUrl` é armazenado no localStorage após o carregamento e removido da URL.
- `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de requisição e Referer. Parâmetros legados de query `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback e são removidos imediatamente após o bootstrap.
- `password` é mantido apenas em memória.
- Quando `gatewayUrl` está definido, a UI não recorre a credenciais de configuração ou de ambiente.
  Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
- Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
- `gatewayUrl` é aceito apenas em uma janela de nível superior (não embutida) para evitar clickjacking.
- Implantações da Interface de controle fora de loopback devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui configurações remotas de desenvolvimento.
- Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto em testes locais rigidamente controlados.
  Isso significa permitir qualquer origem de navegador, não “corresponder a qualquer host que eu esteja
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  o modo de fallback de origem por cabeçalho Host, mas é um modo de segurança perigoso.

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalhes de configuração de acesso remoto: [Acesso remoto](/pt-BR/gateway/remote).

## Relacionado

- [Dashboard](/pt-BR/web/dashboard) — dashboard do gateway
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [Health Checks](/pt-BR/gateway/health) — monitoramento de integridade do gateway
