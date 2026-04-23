---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso pela Tailnet sem túneis SSH
summary: Interface de controle baseada em navegador para o Gateway (chat, Nodes, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T14:09:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce0ed08db83a04d47122c5ada0507d6a9e4c725f8ad4fa8f62cb5d4f0412bfc6
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (navegador)

A Control UI é um pequeno app de página única em **Vite + Lit** servido pelo Gateway:

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
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da guia atual do navegador
e a URL do Gateway selecionada; senhas não são persistidas. O onboarding normalmente
gera um token do Gateway para autenticação por segredo compartilhado na primeira conexão, mas a
autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Control UI a partir de um novo navegador ou dispositivo, o Gateway
exige uma **aprovação única de pareamento** — mesmo que você esteja na mesma Tailnet
com `gateway.auth.allowTailscale: true`. Isso é uma medida de segurança para evitar
acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

**Para aprovar o dispositivo:**

```bash
# Liste solicitações pendentes
openclaw devices list

# Aprove pelo ID da solicitação
openclaw devices approve <requestId>
```

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (papel/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será
criado. Execute `openclaw devices list` novamente antes da aprovação.

Se o navegador já estiver pareado e você o alterar de acesso de leitura para
acesso de escrita/administração, isso será tratado como um upgrade de aprovação, não como
uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão
mais ampla e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos
que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Veja
[Devices CLI](/pt-BR/cli/devices) para rotação de token e revogação.

**Observações:**

- Conexões diretas locais de navegador via local loopback (`127.0.0.1` / `localhost`) são
  aprovadas automaticamente.
- Conexões de navegador via Tailnet e LAN ainda exigem aprovação explícita, mesmo quando
  se originam da mesma máquina.
- Cada perfil de navegador gera um ID de dispositivo único, então trocar de navegador ou
  limpar os dados do navegador exigirá novo pareamento.

## Identidade pessoal (local ao navegador)

A Control UI oferece suporte a uma identidade pessoal por navegador (nome de exibição e
avatar) anexada a mensagens de saída para atribuição em sessões compartilhadas. Ela
fica no armazenamento do navegador, tem escopo do perfil atual do navegador e não é
sincronizada com outros dispositivos nem persistida no lado do servidor além dos metadados normais
de autoria na transcrição das mensagens que você realmente envia. Limpar os dados do site ou
trocar de navegador a redefine para vazio.

## Endpoint de config de runtime

A Control UI busca suas configurações de runtime em
`/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma
autenticação do Gateway que o restante da superfície HTTP: navegadores não autenticados não podem
buscá-lo, e uma busca bem-sucedida exige um token/senha do Gateway já válido,
identidade do Tailscale Serve ou identidade de proxy confiável.

## Suporte a idiomas

A Control UI pode se localizar no primeiro carregamento com base no idioma do seu navegador.
Para sobrescrever isso depois, abra **Overview -> Gateway Access -> Language**. O
seletor de idioma fica no cartão Gateway Access, não em Appearance.

- Idiomas compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Traduções diferentes de inglês são carregadas sob demanda no navegador.
- O idioma selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

## O que ela pode fazer (hoje)

- Conversar com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Fazer streaming de chamadas de Tool + cartões de saída ao vivo de Tool no Chat (eventos do agente)
- Canais: status, login por QR e config por canal para canais integrados mais canais de Plugins integrados/externos (`channels.status`, `web.login.*`, `config.patch`)
- Instâncias: lista de presença + atualização (`system-presence`)
- Sessões: lista + sobrescritas por sessão de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`)
- Dreams: status de Dreaming, alternância ativar/desativar e leitor do Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Trabalhos de Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`)
- Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`)
- Nodes: lista + capacidades (`node.list`)
- Aprovações de execução: editar allowlists do Gateway ou do Node + política de ask para `exec host=gateway/node` (`exec.approvals.*`)
- Config: ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Config: aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa
- Gravações de config incluem uma proteção de hash-base para evitar sobrescrever edições concorrentes
- Gravações de config (`config.set`/`config.apply`/`config.patch`) também fazem um preflight da resolução ativa de SecretRef para refs na carga de config enviada; refs ativos enviados que não puderem ser resolvidos são rejeitados antes da gravação
- Schema de config + renderização de formulário (`config.schema` / `config.schema.lookup`,
  incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos
  imediatos de filhos, metadados de docs em nós aninhados de objeto/curinga/array/composição,
  além de schemas de Plugin + canal quando disponíveis); o editor Raw JSON
  está disponível apenas quando o snapshot tem um round-trip bruto seguro
- Se um snapshot não puder fazer round-trip seguro do texto bruto, a Control UI força o modo Form e desativa o modo Raw para esse snapshot
- O comando "Reset to saved" do editor Raw JSON preserva o formato criado em bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a um reset quando o snapshot puder fazer round-trip seguro
- Valores estruturados de objeto SecretRef são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string
- Depuração: snapshots de status/health/models + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`)
- Logs: tail ao vivo dos logs de arquivo do Gateway com filtro/exportação (`logs.tail`)
- Atualização: executa atualização via pacote/git + reinicialização (`update.run`) com relatório de reinicialização

Observações do painel de trabalhos de Cron:

- Para trabalhos isolados, a entrega usa por padrão resumo de anúncio. Você pode mudar para none se quiser execuções apenas internas.
- Campos de canal/destino aparecem quando announce é selecionado.
- O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de Webhook HTTP(S) válida.
- Para trabalhos da sessão principal, os modos de entrega webhook e none estão disponíveis.
- Controles avançados de edição incluem excluir após execução, limpar sobrescrita de agente, opções exatas/escalonadas de Cron,
  sobrescritas de modelo/thinking do agente e alternâncias de entrega em regime de melhor esforço.
- A validação de formulário é inline com erros por campo; valores inválidos desativam o botão de salvar até serem corrigidos.
- Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o Webhook será enviado sem cabeçalho de autenticação.
- Fallback obsoleto: trabalhos legados armazenados com `notify: true` ainda podem usar `cron.webhook` até serem migrados.

## Comportamento do chat

- `chat.send` é **não bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
- Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução e `{ status: "ok" }` após a conclusão.
- Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando entradas da transcrição são grandes demais, o Gateway pode truncar campos longos de texto, omitir blocos pesados de metadados e substituir mensagens superdimensionadas por um placeholder (`[chat.history omitted: message too large]`).
- `chat.history` também remove tags de diretiva inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamada de Tool em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de Tool) e tokens de controle de modelo vazados em ASCII/largura total, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
- `chat.inject` acrescenta uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas da UI (sem execução do agente, sem entrega em canal).
- Os seletores de modelo e thinking no cabeçalho do chat aplicam patch imediatamente à sessão ativa por `sessions.patch`; são sobrescritas persistentes da sessão, não opções de envio para apenas um turno.
- Parar:
  - Clique em **Stop** (chama `chat.abort`)
  - Digite `/stop` (ou frases autônomas de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda
  - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão
- Retenção parcial de abortos:
  - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI
  - O Gateway persiste o texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer
  - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição possam distinguir parciais de aborto de saídas normais de conclusão

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`.
A política de sandbox do iframe é controlada por
`gateway.controlUi.embedSandbox`:

- `strict`: desativa a execução de scripts dentro de embeds hospedados
- `scripts`: permite embeds interativos mantendo o isolamento de origem; este é
  o padrão e geralmente é suficiente para jogos/widgets autocontidos no navegador
- `trusted`: adiciona `allow-same-origin` além de `allow-scripts` para documentos do mesmo site
  que intencionalmente precisem de privilégios mais fortes

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
comportamento de mesma origem. Para a maioria dos jogos gerados por agente e canvases interativos, `scripts` é
a escolha mais segura.

URLs absolutas externas de embed `http(s)` continuam bloqueadas por padrão. Se você
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

Por padrão, solicitações da Control UI/WebSocket Serve podem autenticar via cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw
verifica a identidade resolvendo o endereço `x-forwarded-for` com
`tailscale whois` e comparando-o com o cabeçalho, e só aceita isso quando a
solicitação atinge o loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Defina
`gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado
mesmo para tráfego do Serve. Então use `gateway.auth.mode: "token"` ou
`"password"`.
Para esse caminho assíncrono de identidade do Serve, tentativas de autenticação com falha para o mesmo IP de cliente
e escopo de autenticação são serializadas antes das gravações de rate-limit. Retries ruins
concorrentes do mesmo navegador podem, portanto, mostrar `retry later` na segunda solicitação
em vez de dois desencontros simples competindo em paralelo.
A autenticação sem token do Serve pressupõe que o host do Gateway é confiável. Se código local não confiável
puder ser executado nesse host, exija autenticação por token/senha.

### Bind na tailnet + token

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
- autenticação bem-sucedida de operador da Control UI por `gateway.auth.mode: "trusted-proxy"`
- modo emergencial `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do Gateway)

**Comportamento da alternância de autenticação insegura:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` é apenas uma alternância local de compatibilidade:

- Ela permite que sessões da Control UI em localhost prossigam sem identidade de dispositivo em
  contextos HTTP não seguros.
- Ela não ignora verificações de pareamento.
- Ela não relaxa requisitos remotos (não localhost) de identidade de dispositivo.

**Somente modo emergencial:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` desativa verificações de identidade de dispositivo da Control UI e é um
rebaixamento grave de segurança. Reverta rapidamente após uso emergencial.

Observação sobre trusted-proxy:

- autenticação bem-sucedida por trusted-proxy pode admitir sessões de operador da Control UI sem
  identidade de dispositivo
- isso **não** se estende a sessões da Control UI com papel de Node
- proxies reversos de loopback no mesmo host ainda não satisfazem autenticação trusted-proxy; veja
  [Trusted Proxy Auth](/pt-BR/gateway/trusted-proxy-auth)

Veja [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração com HTTPS.

## Content Security Policy

A Control UI é distribuída com uma política `img-src` restrita: apenas recursos de **mesma origem** e URLs `data:` são permitidos. URLs de imagem remotas `http(s)` e relativas a protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos sob caminhos relativos (por exemplo `/avatars/<id>`) ainda são renderizados.
- URLs inline `data:image/...` ainda são renderizadas (útil para cargas úteis dentro do protocolo).
- URLs remotas de avatar emitidas por metadados de canal são removidas nos auxiliares de avatar da Control UI e substituídas pelo logo/emblema integrado, para que um canal comprometido ou malicioso não possa forçar buscas arbitrárias de imagem remota a partir do navegador de um operador.

Você não precisa mudar nada para obter esse comportamento — ele está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do Gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do Gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar apenas para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (em correspondência com a rota irmã de mídia do assistente). Isso impede que a rota de avatar vaze identidade do agente em hosts que, de outra forma, estariam protegidos.
- A própria Control UI encaminha o token do Gateway como cabeçalho bearer ao buscar avatares e usa URLs de blob autenticadas para que a imagem ainda seja renderizada nos dashboards.

Se você desativar a autenticação do Gateway (não recomendado em hosts compartilhados), a rota de avatar também se torna não autenticada, em linha com o restante do Gateway.

## Build da UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Faça o build deles com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quiser URLs fixas de recursos):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para a URL WS do seu Gateway (por exemplo `ws://127.0.0.1:18789`).

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Control UI é composta por arquivos estáticos; o destino do WebSocket é configurável e pode ser
diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite
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

- `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
- `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de solicitação e Referer. Parâmetros legados de query `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
- `password` é mantida apenas na memória.
- Quando `gatewayUrl` está definido, a UI não recorre a credenciais de config ou do ambiente.
  Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
- Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
- `gatewayUrl` só é aceito em uma janela de nível superior (não embutida) para evitar clickjacking.
- Implantações da Control UI fora do loopback devem definir `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Isso inclui configurações remotas de desenvolvimento.
- Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto em testes locais
  rigidamente controlados. Isso significa permitir qualquer origem de navegador, não “corresponder a qualquer host que eu esteja
  usando”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa
  o modo de fallback de origem via cabeçalho Host, mas esse é um modo de segurança perigoso.

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

- [Dashboard](/pt-BR/web/dashboard) — dashboard do Gateway
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [Health Checks](/pt-BR/gateway/health) — monitoramento de integridade do Gateway
