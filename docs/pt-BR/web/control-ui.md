---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso por Tailnet sem túneis SSH
summary: Control UI baseada em navegador para o Gateway (chat, Nodes, configuração)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T18:22:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
    source_path: web/control-ui.md
    workflow: 15
---

A Control UI é um pequeno app de página única em **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da guia atual do navegador
e para a URL do gateway selecionada; senhas não são persistidas. O onboarding geralmente
gera um token do gateway para autenticação por segredo compartilhado na primeira conexão, mas a
autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento do dispositivo (primeira conexão)

Quando você se conecta à Control UI a partir de um novo navegador ou dispositivo, o Gateway
exige uma **aprovação única de pareamento** — mesmo se você estiver na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Esta é uma medida de segurança para evitar
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# Listar solicitações pendentes
openclaw devices list

# Aprovar por ID da solicitação
openclaw devices approve <requestId>
```

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave
pública), a solicitação pendente anterior será substituída e um novo `requestId` será
criado. Execute `openclaw devices list` novamente antes da aprovação.

Se o navegador já estiver pareado e você o alterar de acesso de leitura para
acesso de escrita/admin, isso será tratado como uma atualização de aprovação, não como uma
reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla
e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos
que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte
[CLI de dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

**Observações:**

- Conexões diretas locais de navegador por loopback (`127.0.0.1` / `localhost`) são
  aprovadas automaticamente.
- Conexões de navegador por Tailnet e LAN ainda exigem aprovação explícita, mesmo quando
  se originam da mesma máquina.
- Cada perfil de navegador gera um ID de dispositivo exclusivo, então trocar de navegador ou
  limpar os dados do navegador exigirá novo pareamento.

## Identidade pessoal (local ao navegador)

A Control UI oferece suporte a uma identidade pessoal por navegador (nome de exibição e
avatar) anexada às mensagens de saída para atribuição em sessões compartilhadas. Ela
fica no armazenamento do navegador, é limitada ao perfil atual do navegador e não é
sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais
de autoria na transcrição das mensagens que você realmente envia. Limpar os dados do site ou
trocar de navegador a redefine para vazio.

O mesmo padrão local ao navegador se aplica à substituição do avatar do assistente.
Avatares enviados do assistente sobrepõem a identidade resolvida pelo gateway apenas no navegador local
e nunca fazem ida e volta por `config.patch`. O campo de configuração compartilhado
`ui.assistant.avatar` continua disponível para clientes fora da UI que gravam o campo diretamente
(como gateways com script ou dashboards personalizados).

## Endpoint de configuração de runtime

A Control UI busca suas configurações de runtime em
`/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma
autenticação do gateway que protege o restante da superfície HTTP: navegadores não autenticados não podem
buscá-lo, e uma busca bem-sucedida exige um token/senha do gateway já válido,
identidade do Tailscale Serve ou identidade de proxy confiável.

## Suporte a idioma

A Control UI pode se localizar automaticamente no primeiro carregamento com base no locale do seu navegador.
Para substituí-lo depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O
seletor de locale fica no cartão Acesso ao Gateway, não em Aparência.

- Locales compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Traduções que não estão em inglês são carregadas sob demanda no navegador.
- O locale selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes usam inglês como fallback.

## O que ela pode fazer (hoje)

- Conversar com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Falar diretamente com OpenAI Realtime a partir do navegador via WebRTC. O Gateway
  emite um segredo de cliente Realtime de curta duração com `talk.realtime.session`; o
  navegador envia áudio do microfone diretamente para a OpenAI e retransmite chamadas de ferramenta
  `openclaw_agent_consult` de volta por `chat.send` para o modelo maior configurado no OpenClaw.
- Fazer stream de chamadas de ferramenta + cartões de saída ao vivo de ferramenta no Chat (eventos do agente)
- Canais: status, login por QR e configuração por canal para canais internos e de plugin incluídos/externos (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: lista + substituições por sessão para modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: status de Dreaming, alternância ativar/desativar e leitor do Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Jobs Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`)
- Skills: status, ativar/desativar, instalar, atualizar chave de API (`skills.*`)
- Nodes: lista + limites (`node.list`)
- Aprovações de exec: editar listas de permissão do gateway ou do Node + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`)
- Configuração: visualizar/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Configuração: aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa
- Gravações de configuração incluem uma proteção por hash-base para evitar sobrescrever edições concorrentes
- Gravações de configuração (`config.set`/`config.apply`/`config.patch`) também executam uma verificação preliminar de resolução ativa de SecretRef para refs no payload de configuração enviado; refs ativos enviados não resolvidos são rejeitados antes da gravação
- Schema de configuração + renderização de formulário (`config.schema` / `config.schema.lookup`,
  incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos imediatos dos
  filhos, metadados de documentação em nós aninhados de objeto/curinga/array/composição,
  além de schemas de plugin + canal quando disponíveis); o editor Raw JSON fica
  disponível apenas quando o snapshot tem um round-trip bruto seguro
- Se um snapshot não puder fazer round-trip com segurança como texto bruto, a Control UI força o modo Form e desativa o modo Raw para esse snapshot
- O "Reset to saved" do editor Raw JSON preserva a forma originalmente escrita em bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer round-trip com segurança
- Valores estruturados de objeto SecretRef são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string
- Depuração: snapshots de status/integridade/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`)
- Logs: tail ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`)
- Atualização: executar uma atualização de pacote/git + reiniciar (`update.run`) com relatório de reinicialização

Observações sobre o painel de jobs Cron:

- Para jobs isolados, a entrega usa por padrão anunciar resumo. Você pode mudar para none se quiser execuções apenas internas.
- Os campos channel/target aparecem quando announce é selecionado.
- O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de Webhook HTTP(S) válida.
- Para jobs da sessão principal, os modos de entrega webhook e none estão disponíveis.
- Os controles avançados de edição incluem excluir após execução, limpar substituição de agente, opções exatas/escalonadas de Cron,
  substituições de modelo/thinking do agente e alternâncias de entrega best-effort.
- A validação do formulário é inline com erros por campo; valores inválidos desativam o botão de salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um bearer token dedicado; se omitido, o Webhook será enviado sem cabeçalho de autenticação.
- Fallback obsoleto: jobs legados armazenados com `notify: true` ainda podem usar `cron.webhook` até serem migrados.

## Comportamento do chat

- `chat.send` é **não bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por meio de eventos `chat`.
- Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução, e `{ status: "ok" }` após a conclusão.
- As respostas de `chat.history` têm tamanho limitado por segurança da UI. Quando entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
- Imagens do assistente/geradas são persistidas como referências de mídia gerenciada e servidas novamente por URLs de mídia autenticadas do Gateway, para que recarregamentos não dependam de payloads brutos de imagem em base64 permanecerem na resposta de histórico do chat.
- `chat.history` também remove do texto visível do assistente tags inline apenas de exibição (por exemplo, `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), além de tokens de controle do modelo vazados em ASCII/largura completa, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
- Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém visíveis
  mensagens otimistas locais de usuário/assistente se `chat.history` retornar brevemente
  um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais assim que
  o histórico do Gateway alcança o estado atual.
- `chat.inject` anexa uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas da UI (sem execução de agente, sem entrega em canal).
- Os seletores de modelo e thinking no cabeçalho do chat aplicam patch à sessão ativa imediatamente por meio de `sessions.patch`; são substituições persistentes da sessão, não opções de envio válidas apenas para um turno.
- Quando relatórios recentes de uso de sessão do Gateway mostram alta pressão de contexto, a área do
  compositor do chat exibe um aviso de contexto e, nos níveis recomendados de Compaction, um
  botão de compactação que executa o caminho normal de compactação da sessão. Snapshots
  obsoletos de tokens ficam ocultos até que o Gateway informe uso recente novamente.
- O modo Talk usa um provider de voz em tempo real registrado que oferece suporte a sessões WebRTC no navegador. Configure a OpenAI com `talk.provider: "openai"` mais
  `talk.providers.openai.apiKey`, ou reutilize a configuração do provider de Voice Call em tempo real. O
  navegador nunca recebe a chave de API padrão da OpenAI; ele recebe apenas
  o segredo efêmero do cliente Realtime. A voz em tempo real do Google Live é
  compatível com o Voice Call de backend e pontes do Google Meet, mas ainda não com este caminho
  WebRTC no navegador. O prompt da sessão Realtime é montado pelo Gateway;
  `talk.realtime.session` não aceita substituições de instrução fornecidas pelo chamador.
- No compositor do Chat, o controle Talk é o botão de ondas ao lado do
  botão de ditado por microfone. Quando o Talk inicia, a linha de status do compositor mostra
  `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou
  `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o
  modelo maior configurado por meio de `chat.send`.
- Parar:
  - Clique em **Stop** (chama `chat.abort`)
  - Enquanto uma execução está ativa, acompanhamentos normais entram na fila. Clique em **Steer** em uma mensagem enfileirada para injetar esse acompanhamento no turno em execução.
  - Digite `/stop` (ou frases autônomas de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora da banda
  - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão
- Retenção parcial de aborto:
  - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI
  - O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer
  - As entradas persistidas incluem metadados de aborto para que consumidores da transcrição possam distinguir parciais abortados de saídas normais concluídas

## Instalação como PWA e Web Push

A Control UI inclui `manifest.webmanifest` e um service worker, então
navegadores modernos podem instalá-la como uma PWA autônoma. O Web Push permite que o
Gateway desperte a PWA instalada com notificações mesmo quando a aba ou
janela do navegador não estiver aberta.

| Superfície                                            | O que faz                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto PWA. Os navegadores oferecem "Instalar app" quando ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (sob o diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente e usado para assinar payloads de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura do navegador persistidos.                  |

Substitua o par de chaves VAPID por variáveis de ambiente no processo do Gateway quando
você quiser fixar chaves (para implantações com vários hosts, rotação de segredos ou
testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `mailto:openclaw@localhost`)

A Control UI usa estes métodos do Gateway protegidos por escopo para registrar e
testar assinaturas do navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

O Web Push é independente do caminho de relay APNS do iOS
(consulte [Configuration](/pt-BR/gateway/configuration) para push com relay) e
do método existente `push.test`, que mira o pareamento de aplicativos nativos.

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`.
A política de sandbox de iframe é controlada por
`gateway.controlUi.embedSandbox`:

- `strict`: desativa a execução de scripts dentro de embeds hospedados
- `scripts`: permite embeds interativos enquanto mantém isolamento de origem; este é
  o padrão e geralmente é suficiente para jogos/widgets autocontidos no navegador
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

Use `trusted` apenas quando o documento incorporado realmente precisar de
comportamento same-origin. Para a maioria dos jogos gerados por agente e canvas interativos, `scripts` é
a escolha mais segura.

URLs absolutas externas de embed `http(s)` continuam bloqueadas por padrão. Se você
intencionalmente quiser que `[embed url="https://..."]` carregue páginas de terceiros, defina
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Acesso por Tailnet (recomendado)

### Tailscale Serve integrado (preferido)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

```bash
openclaw gateway --tailscale serve
```

Abra:

- `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

Por padrão, requisições da Control UI/WebSocket via Serve podem se autenticar por cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e comparando-o com o cabeçalho, e só aceita isso quando a
requisição atinge o loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas por segredo compartilhado
mesmo para tráfego do Serve. Então use `gateway.auth.mode: "token"` ou
`"password"`.
Para esse caminho assíncrono de identidade do Serve, tentativas de autenticação com falha do mesmo IP cliente
e do mesmo escopo de autenticação são serializadas antes das gravações de rate limit. Retries ruins concorrentes
do mesmo navegador podem, portanto, mostrar `retry later` na segunda requisição
em vez de duas incompatibilidades simples competindo em paralelo.
A autenticação sem token via Serve presume que o host do gateway é confiável. Se código local não confiável puder executar nesse host, exija autenticação por token/senha.

### Bind à tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Depois abra:

- `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

Cole o segredo compartilhado correspondente nas configurações da UI (enviado como
`connect.params.auth.token` ou `connect.params.auth.password`).

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`),
o navegador será executado em um **contexto não seguro** e bloqueará o WebCrypto. Por padrão,
o OpenClaw **bloqueia** conexões da Control UI sem identidade do dispositivo.

Exceções documentadas:

- compatibilidade de HTTP inseguro somente em localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida de operador na Control UI por `gateway.auth.mode: "trusted-proxy"`
- modo emergencial `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

`allowInsecureAuth` é apenas um toggle local de compatibilidade:

- Permite que sessões da Control UI em localhost prossigam sem identidade do dispositivo em
  contextos HTTP não seguros.
- Não ignora verificações de pareamento.
- Não relaxa requisitos remotos (não localhost) de identidade do dispositivo.

**Apenas para uso emergencial:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desativa verificações de identidade do dispositivo da Control UI e é uma
grave redução de segurança. Reverta rapidamente após o uso emergencial.

Observação sobre proxy confiável:

- autenticação bem-sucedida de proxy confiável pode admitir sessões de **operador** da Control UI sem
  identidade do dispositivo
- isso **não** se estende a sessões da Control UI com função de Node
- proxies reversos em loopback no mesmo host ainda não satisfazem a autenticação de proxy confiável; consulte
  [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração de HTTPS.

## Content Security Policy

A Control UI é distribuída com uma política `img-src` restrita: apenas ativos **same-origin**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs remotas `http(s)` e URLs de imagem relativas a protocolo são rejeitadas pelo navegador e não emitem requisições de rede.

O que isso significa na prática:

- Avatares e imagens servidos por caminhos relativos (por exemplo, `/avatars/<id>`) ainda são renderizados, incluindo rotas autenticadas de avatar que a UI busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` ainda são renderizadas (útil para payloads no próprio protocolo).
- URLs `blob:` locais criadas pela Control UI ainda são renderizadas.
- URLs remotas de avatar emitidas pelos metadados do canal são removidas pelos helpers de avatar da Control UI e substituídas pelo logotipo/emblema interno, para que um canal comprometido ou malicioso não possa forçar requisições remotas arbitrárias de imagem a partir do navegador de um operador.

Você não precisa mudar nada para obter esse comportamento — ele está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar apenas para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Requisições não autenticadas para qualquer uma das duas rotas são rejeitadas (em correspondência com a rota irmã de mídia do assistente). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estariam protegidos.
- A própria Control UI encaminha o token do gateway como cabeçalho bearer ao buscar avatares e usa URLs `blob:` autenticadas para que a imagem continue sendo renderizada nos dashboards.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também se tornará não autenticada, em linha com o restante do gateway.

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quiser URLs fixas de ativos):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor dev separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Depuração/testes: servidor dev + Gateway remoto

A Control UI consiste em arquivos estáticos; o destino do WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor dev do Vite
localmente, mas o Gateway está em execução em outro lugar.

1. Inicie o servidor dev da UI: `pnpm ui:dev`
2. Abra uma URL como:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Autenticação opcional de uso único (se necessário):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Observações:

- `gatewayUrl` é armazenado em `localStorage` após o carregamento e removido da URL.
- `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de requisição e em Referer. Parâmetros legados de query `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
- `password` é mantido apenas na memória.
- Quando `gatewayUrl` está definido, a UI não usa como fallback credenciais de configuração ou de ambiente.
  Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
- Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
- `gatewayUrl` é aceito apenas em uma janela de nível superior (não embutida) para evitar clickjacking.
- Implantações da Control UI fora de loopback devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui configurações dev remotas.
- Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto em testes locais
  rigidamente controlados. Isso significa permitir qualquer origem de navegador, não “corresponder a qualquer host que eu esteja
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa
  o modo de fallback de origem por cabeçalho Host, mas esse é um modo de segurança perigoso.

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

Detalhes da configuração de acesso remoto: [Acesso remoto](/pt-BR/gateway/remote).

## Relacionado

- [Dashboard](/pt-BR/web/dashboard) — dashboard do gateway
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento da integridade do gateway
