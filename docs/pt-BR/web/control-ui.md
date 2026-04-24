---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso por tailnet sem túneis SSH
summary: UI de controle baseada em navegador para o Gateway (chat, nodes, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T06:20:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ad0d0cef7d842eddf665ba50f37403df258b17d4c072d22a30d1bc3830dc467
    source_path: web/control-ui.md
    workflow: 15
---

A Control UI é um pequeno app de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo `/openclaw`)

Ela fala **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie primeiro o Gateway: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da aba atual
do navegador e a URL selecionada do gateway; senhas não são persistidas. O onboarding normalmente
gera um token de gateway para autenticação por segredo compartilhado na primeira conexão, mas
autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pairing de dispositivo (primeira conexão)

Quando você se conecta à Control UI a partir de um novo navegador ou dispositivo, o Gateway
exige uma **aprovação única de pairing** — mesmo que você esteja na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Essa é uma medida de segurança para impedir
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```

Se o navegador tentar novamente o pairing com detalhes de autenticação alterados (role/scopes/public
key), a solicitação pendente anterior será substituída e um novo `requestId` será
criado. Execute `openclaw devices list` novamente antes de aprovar.

Se o navegador já estiver pareado e você o alterar de acesso de leitura para
acesso de escrita/administração, isso é tratado como um upgrade de aprovação, não como
uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão
mais ampla e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos
que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte
[Devices CLI](/pt-BR/cli/devices) para rotação de token e revogação.

**Observações:**

- Conexões diretas de navegador via loopback local (`127.0.0.1` / `localhost`) são
  aprovadas automaticamente.
- Conexões de navegador por tailnet e LAN ainda exigem aprovação explícita, mesmo quando
  se originam da mesma máquina.
- Cada perfil de navegador gera um ID de dispositivo exclusivo, então trocar de navegador ou
  limpar dados do navegador exigirá novo pairing.

## Identidade pessoal (local ao navegador)

A Control UI oferece suporte a uma identidade pessoal por navegador (nome de exibição e
avatar) anexada a mensagens de saída para atribuição em sessões compartilhadas. Ela
vive no armazenamento do navegador, tem escopo para o perfil atual do navegador e não é
sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais
de autoria na transcrição das mensagens que você realmente envia. Limpar dados do site ou
trocar de navegador a redefine para vazio.

## Endpoint de configuração de runtime

A Control UI busca suas configurações de runtime em
`/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma
autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não podem
buscá-lo, e uma busca bem-sucedida exige um token/senha válidos do gateway, identidade do Tailscale Serve ou identidade de trusted-proxy.

## Suporte a idioma

A Control UI pode se localizar no primeiro carregamento com base no locale do seu navegador.
Para substituí-lo depois, abra **Overview -> Gateway Access -> Language**. O
seletor de locale fica no cartão Gateway Access, não em Appearance.

- Locales compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Traduções não inglesas são carregadas sob demanda no navegador.
- O locale selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes usam fallback para inglês.

## O que ela pode fazer (hoje)

- Conversar com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Conversar com o OpenAI Realtime diretamente do navegador via WebRTC. O Gateway
  gera um segredo temporário de cliente Realtime com `talk.realtime.session`; o
  navegador envia áudio do microfone diretamente para a OpenAI e retransmite
  chamadas de ferramenta `openclaw_agent_consult` de volta por `chat.send` para o
  modelo OpenClaw maior configurado.
- Fazer streaming de chamadas de ferramenta + cartões de saída ativa de ferramenta no Chat (eventos do agente)
- Canais: status, login por QR e configuração por canal para canais integrados mais canais de Plugins incluídos/externos (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: lista + substituições por sessão de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: status de dreaming, toggle de ativar/desativar e leitor do Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Trabalhos Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`)
- Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Exec approvals: editar allowlists do gateway ou do Node + política ask para `exec host=gateway/node` (`exec.approvals.*`)
- Configuração: visualizar/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuração: aplicar + reiniciar com validação (`config.apply`) e acordar a última sessão ativa
- Gravações de configuração incluem proteção por hash-base para evitar sobrescrever edições concorrentes
- Gravações de configuração (`config.set`/`config.apply`/`config.patch`) também fazem pré-verificação de resolução de SecretRef ativo para refs na carga enviada; refs ativos enviados que não puderem ser resolvidos são rejeitados antes da gravação
- Schema de configuração + renderização de formulário (`config.schema` / `config.schema.lookup`,
  incluindo `title` / `description` do campo, dicas de UI correspondidas, resumos imediatos de filhos, metadados de documentação em nós aninhados de objeto/wildcard/array/composição,
  além de schemas de Plugin + canal quando disponíveis); o editor Raw JSON
  só fica disponível quando o snapshot tem round-trip bruto seguro
- Se um snapshot não puder fazer round-trip seguro de texto bruto, a Control UI força o modo Form e desativa o modo Raw para aquele snapshot
- O botão "Reset to saved" do editor Raw JSON preserva a forma original criada em bruto (formatação, comentários, layout de `$include`) em vez de rerenderizar um snapshot achatado, então edições externas sobrevivem a um reset quando o snapshot pode fazer round-trip com segurança
- Valores estruturados de objeto SecretRef são renderizados como somente leitura em campos de texto do formulário para evitar corrupção acidental de objeto para string
- Depuração: snapshots de status/health/models + log de eventos + chamadas manuais de RPC (`status`, `health`, `models.list`)
- Logs: tail ao vivo dos logs em arquivo do gateway com filtro/exportação (`logs.tail`)
- Atualização: executar uma atualização de pacote/git + reinício (`update.run`) com relatório de reinício

Observações sobre o painel de trabalhos Cron:

- Para trabalhos isolados, a entrega usa por padrão announce summary. Você pode alternar para none se quiser execuções somente internas.
- Campos de canal/destino aparecem quando announce está selecionado.
- O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de Webhook HTTP(S) válida.
- Para trabalhos de sessão main, os modos de entrega webhook e none estão disponíveis.
- Controles avançados de edição incluem delete-after-run, limpar substituição de agente, opções exact/stagger de cron,
  substituições de modelo/thinking do agente e toggles de entrega best-effort.
- A validação do formulário é inline com erros por campo; valores inválidos desativam o botão de salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
- Fallback obsoleto: trabalhos legados armazenados com `notify: true` ainda podem usar `cron.webhook` até serem migrados.

## Comportamento do chat

- `chat.send` é **não bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
- Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução, e `{ status: "ok" }` após a conclusão.
- Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando entradas de transcrição são grandes demais, o Gateway pode truncar campos longos de texto, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
- Imagens de assistente/geradas são persistidas como refs gerenciadas de mídia e servidas de volta por URLs autenticadas de mídia do Gateway, para que recarregamentos não dependam de payloads brutos base64 de imagem permanecerem na resposta do histórico do chat.
- `chat.history` também remove tags inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), cargas XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e tokens de controle do modelo vazados em ASCII/full-width, além de omitir entradas de assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
- `chat.inject` acrescenta uma observação do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas de UI (sem execução de agente, sem entrega em canal).
- Os seletores de modelo e thinking no cabeçalho do chat fazem patch da sessão ativa imediatamente por `sessions.patch`; são substituições persistentes da sessão, não opções de envio para um único turno.
- O modo Talk usa o provedor de voz em tempo real registrado. Configure OpenAI com
  `talk.provider: "openai"` mais `talk.providers.openai.apiKey`, ou reutilize a
  configuração do provedor em tempo real do Voice Call. O navegador nunca recebe a chave de API padrão da OpenAI; ele recebe apenas o segredo efêmero do cliente Realtime. O prompt da sessão Realtime é montado pelo Gateway; `talk.realtime.session` não aceita substituições de instrução fornecidas pelo chamador.
- No compositor do Chat, o controle Talk é o botão de ondas ao lado do botão
  de ditado por microfone. Quando o Talk começa, a linha de status do compositor mostra
  `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou
  `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real está consultando o modelo maior configurado por meio de `chat.send`.
- Parar:
  - Clique em **Stop** (chama `chat.abort`)
  - Enquanto uma execução estiver ativa, acompanhamentos normais entram em fila. Clique em **Steer** em uma mensagem na fila para injetar esse acompanhamento no turno em execução.
  - Digite `/stop` (ou frases isoladas de abort, como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda
  - `chat.abort` oferece suporte a `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas daquela sessão
- Retenção parcial de abort:
  - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI
  - O Gateway persiste o texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer
  - Entradas persistidas incluem metadados de abort para que consumidores da transcrição possam distinguir saídas parciais de abort de saídas normais concluídas

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`.
A política de sandbox do iframe é controlada por
`gateway.controlUi.embedSandbox`:

- `strict`: desativa execução de scripts dentro de embeds hospedados
- `scripts`: permite embeds interativos mantendo isolamento de origem; este é
  o padrão e normalmente é suficiente para jogos/widgets autocontidos no navegador
- `trusted`: adiciona `allow-same-origin` além de `allow-scripts` para
  documentos do mesmo site que intencionalmente precisem de privilégios mais fortes

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

Use `trusted` apenas quando o documento incorporado realmente precisar de
comportamento same-origin. Para a maioria dos jogos gerados por agente e canvases interativos, `scripts` é
a escolha mais segura.

URLs externas absolutas de embed `http(s)` continuam bloqueadas por padrão. Se você
quiser intencionalmente que `[embed url="https://..."]` carregue páginas de terceiros, defina
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acesso por tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abra:

- `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

Por padrão, solicitações de Control UI/WebSocket via Serve podem se autenticar com cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e comparando-o com o cabeçalho, e só aceita isso quando a
solicitação chega a loopback com cabeçalhos `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado
mesmo para tráfego do Serve. Nesse caso, use `gateway.auth.mode: "token"` ou
`"password"`.
Para esse caminho assíncrono de identidade do Serve, tentativas de autenticação
fracassadas para o mesmo IP de cliente e escopo de autenticação são serializadas
antes de gravações de limite de taxa. Por isso, novas tentativas concorrentes inválidas do mesmo navegador
podem mostrar `retry later` na segunda solicitação em vez de dois erros simples de incompatibilidade correndo em paralelo.
Autenticação Serve sem token assume que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.

### Bind em tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Depois abra:

- `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` configurado)

Cole o segredo compartilhado correspondente nas configurações da UI (enviado como
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`),
o navegador será executado em um **contexto não seguro** e bloqueará WebCrypto. Por padrão,
o OpenClaw **bloqueia** conexões da Control UI sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade de HTTP inseguro apenas para localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida de operador na Control UI por `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

**Comportamento do toggle de autenticação insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` é apenas um toggle de compatibilidade local:

- Ele permite que sessões da Control UI em localhost prossigam sem identidade de dispositivo em
  contextos HTTP não seguros.
- Ele não ignora verificações de pairing.
- Ele não flexibiliza requisitos de identidade de dispositivo remotos (não localhost).

**Apenas break-glass:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desativa verificações de identidade de dispositivo da Control UI e é uma
redução severa de segurança. Reverta rapidamente após uso emergencial.

Observação sobre trusted-proxy:

- autenticação bem-sucedida por trusted-proxy pode admitir sessões de operador na Control UI **sem**
  identidade de dispositivo
- isso **não** se estende a sessões de Control UI com role de node
- proxies reversos em loopback no mesmo host ainda não satisfazem autenticação trusted-proxy; consulte
  [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração com HTTPS.

## Content Security Policy

A Control UI é fornecida com uma política `img-src` rígida: apenas recursos de **mesma origem** e URLs `data:` são permitidos. URLs remotas `http(s)` e URLs de imagem relativas a protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo `/avatars/<id>`) ainda são renderizados.
- URLs inline `data:image/...` ainda são renderizadas (útil para cargas em protocolo).
- URLs remotas de avatar emitidas por metadados de canal são removidas pelos helpers de avatar da Control UI e substituídas pelo logotipo/badge integrado, para que um canal comprometido ou malicioso não possa forçar buscas remotas arbitrárias de imagem a partir do navegador de um operador.

Você não precisa mudar nada para obter esse comportamento — ele está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do gateway usado no restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar apenas para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (em conformidade com a rota irmã de mídia do assistente). Isso impede que a rota de avatar vaze identidade do agente em hosts que, de outra forma, estão protegidos.
- A própria Control UI encaminha o token do gateway como cabeçalho bearer ao buscar avatares e usa blob URLs autenticadas para que a imagem continue sendo renderizada nos dashboards.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também se tornará não autenticada, em linha com o restante do gateway.

## Construindo a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Construa-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quer URLs fixas de assets):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor dev separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para sua URL WS do Gateway (por exemplo `ws://127.0.0.1:18789`).

## Depuração/teste: servidor dev + Gateway remoto

A Control UI são arquivos estáticos; o alvo do WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor dev do Vite
localmente, mas o Gateway roda em outro lugar.

1. Inicie o servidor dev da UI: `pnpm ui:dev`
2. Abra uma URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticação única opcional (se necessário):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Observações:

- `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
- `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de requisição e Referer. Parâmetros legados `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
- `password` é mantida apenas em memória.
- Quando `gatewayUrl` está definido, a UI não usa fallback para credenciais de configuração ou ambiente.
  Forneça `token` (ou `password`) explicitamente. A falta de credenciais explícitas é um erro.
- Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
- `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
- Implantações não loopback da Control UI devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui configurações remotas de desenvolvimento.
- Não use `gateway.controlUi.allowedOrigins: ["*"]`, exceto em testes locais rigidamente controlados.
  Isso significa permitir qualquer origem de navegador, não “corresponder a qualquer host que eu esteja
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa
  o modo de fallback de origem pelo cabeçalho Host, mas isso é um modo de segurança perigoso.

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

Detalhes de configuração de acesso remoto: [Remote access](/pt-BR/gateway/remote).

## Relacionado

- [Dashboard](/pt-BR/web/dashboard) — dashboard do gateway
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [Health Checks](/pt-BR/gateway/health) — monitoramento da integridade do gateway
