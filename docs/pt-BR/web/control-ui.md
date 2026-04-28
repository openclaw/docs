---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: UI de controle do Gateway baseada em navegador (chat, nós, configuração)
title: UI de controle
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:40:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

A UI de controle é um pequeno app de página única **Vite + Lit** servido pelo Gateway:

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

O painel de configurações do dashboard mantém um token para a sessão atual da aba do navegador e a URL do gateway selecionada; senhas não são persistidas. A configuração inicial normalmente gera um token do gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à UI de controle a partir de um novo navegador ou dispositivo, o Gateway normalmente exige uma **aprovação única de pareamento**. Essa é uma medida de segurança para evitar acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Listar solicitações pendentes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprovar pelo ID da solicitação">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (papel/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute `openclaw devices list` novamente antes da aprovação.

Se o navegador já estiver pareado e você mudar o acesso de leitura para acesso de escrita/administração, isso será tratado como uma atualização de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão com escopo ampliado e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de dispositivos](/pt-BR/cli/devices) para rotação de token e revogação.

<Note>
- Conexões diretas de navegador local em loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode pular a ida e volta de pareamento para sessões de operador da UI de controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Vínculos diretos à Tailnet, conexões de navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo exclusivo, então trocar de navegador ou limpar os dados do navegador exigirá novo pareamento.
</Note>

## Identidade pessoal (local do navegador)

A UI de controle oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada às mensagens de saída para atribuição em sessões compartilhadas. Ela fica no armazenamento do navegador, é restrita ao perfil atual do navegador e não é sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais de autoria do histórico das mensagens que você realmente envia. Limpar os dados do site ou trocar de navegador a redefine para vazia.

O mesmo padrão local do navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca passam de ida e volta por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` continua disponível para clientes não UI que gravam o campo diretamente (como gateways com script ou dashboards personalizados).

## Endpoint de configuração de runtime

A UI de controle busca suas configurações de runtime em `/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma autenticação do gateway usada no restante da superfície HTTP: navegadores não autenticados não podem buscá-lo, e uma busca bem-sucedida exige um token/senha do gateway já válido, identidade do Tailscale Serve ou uma identidade de proxy confiável.

## Suporte a idioma

A UI de controle pode se localizar na primeira carga com base no local do seu navegador. Para substituí-lo depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de local fica no cartão Acesso ao Gateway, não em Aparência.

- Locais compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Traduções que não sejam em inglês são carregadas sob demanda no navegador.
- O local selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes usam fallback para inglês.

## O que ela pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Chat e Talk">
    - Converse com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Fale diretamente com o OpenAI Realtime do navegador via WebRTC. O Gateway gera um client secret Realtime de curta duração com `talk.realtime.session`; o navegador envia áudio do microfone diretamente para a OpenAI e retransmite chamadas de ferramenta `openclaw_agent_consult` de volta por `chat.send` para o modelo OpenClaw maior configurado.
    - Faça streaming de chamadas de ferramenta + cartões de saída de ferramenta ao vivo no Chat (eventos do agente).
  </Accordion>
  <Accordion title="Canais, instâncias, sessões, sonhos">
    - Canais: status de canais integrados mais canais de Plugins incluídos/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: listar + substituições por sessão de modelo/thinking/rápido/verboso/trace/raciocínio (`sessions.list`, `sessions.patch`).
    - Sonhos: status de Dreaming, alternância de habilitar/desabilitar e leitor do Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
  </Accordion>
  <Accordion title="Cron, Skills, nós, aprovações de exec">
    - Jobs do Cron: listar/adicionar/editar/executar/habilitar/desabilitar + histórico de execução (`cron.*`).
    - Skills: status, habilitar/desabilitar, instalar, atualizações de chave de API (`skills.*`).
    - Nós: lista + limites (`node.list`).
    - Aprovações de exec: editar allowlists do gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).
  </Accordion>
  <Accordion title="Configuração">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa.
    - Gravações incluem uma proteção por hash base para evitar sobrescrever edições simultâneas.
    - Gravações (`config.set`/`config.apply`/`config.patch`) fazem uma verificação preliminar da resolução de SecretRef ativo para refs na carga de configuração enviada; refs ativos enviados não resolvidos são rejeitados antes da gravação.
    - Renderização de schema + formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos imediatos de filhos, metadados de documentação em nós aninhados de objeto/curinga/array/composição, além de schemas de Plugin + canal quando disponíveis); o editor Raw JSON só fica disponível quando o snapshot tem um round-trip bruto seguro.
    - Se um snapshot não puder fazer round-trip seguro do texto bruto, a UI de controle força o modo Form e desabilita o modo Raw para esse snapshot.
    - No editor Raw JSON, "Reset to saved" preserva a forma criada em raw (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer round-trip com segurança.
    - Valores de objeto SecretRef estruturado são renderizados somente leitura em entradas de texto do formulário para evitar corrupção acidental de objeto para string.
  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - Logs: tail ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: executar atualização de pacote/git + reinicialização (`update.run`) com um relatório de reinicialização.
  </Accordion>
  <Accordion title="Observações do painel de jobs do Cron">
    - Para jobs isolados, a entrega usa por padrão resumo de anúncio. Você pode mudar para none se quiser execuções apenas internas.
    - Campos de canal/destino aparecem quando announce é selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido para uma URL de Webhook HTTP(S) válida.
    - Para jobs da sessão principal, os modos de entrega webhook e none estão disponíveis.
    - Controles avançados de edição incluem excluir após executar, limpar substituição de agente, opções exatas/escalonadas do cron, substituições de modelo/thinking do agente e alternâncias de entrega por melhor esforço.
    - A validação do formulário é inline com erros por campo; valores inválidos desabilitam o botão salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o Webhook é enviado sem cabeçalho de autenticação.
    - Fallback obsoleto: jobs legados armazenados com `notify: true` ainda podem usar `cron.webhook` até serem migrados.
  </Accordion>
</AccordionGroup>

## Comportamento do chat

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: ele confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
    - Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução e `{ status: "ok" }` após a conclusão.
    - Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando as entradas do histórico são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Imagens geradas pelo assistente são persistidas como referências de mídia gerenciadas e servidas de volta por URLs de mídia autenticadas do Gateway, para que recargas não dependam de cargas brutas de imagem base64 permanecerem na resposta de histórico do chat.
    - `chat.history` também remove tags de diretiva inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), cargas XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e tokens de controle do modelo vazados em ASCII/largura total, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
    - Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém visíveis mensagens locais otimistas de usuário/assistente se `chat.history` retornar brevemente um snapshot mais antigo; o histórico canônico substitui essas mensagens locais assim que o histórico do Gateway alcança o estado atual.
    - `chat.inject` anexa uma nota do assistente ao histórico da sessão e transmite um evento `chat` para atualizações somente da UI (sem execução do agente, sem entrega por canal).
    - Os seletores de modelo e thinking no cabeçalho do chat aplicam patch imediatamente à sessão ativa por meio de `sessions.patch`; são substituições persistentes da sessão, não opções de envio para apenas um turno.
    - Quando relatórios recentes de uso de sessão do Gateway mostram alta pressão de contexto, a área de composição do chat mostra um aviso de contexto e, em níveis recomendados de Compaction, um botão de compactar que executa o caminho normal de Compaction da sessão. Snapshots antigos de tokens ficam ocultos até que o Gateway volte a reportar uso recente.
  </Accordion>
  <Accordion title="Modo Talk (WebRTC no navegador)">
    O modo Talk usa um provedor de voz realtime registrado que oferece suporte a sessões WebRTC no navegador. Configure a OpenAI com `talk.provider: "openai"` mais `talk.providers.openai.apiKey`, ou reutilize a configuração do provedor realtime do Voice Call. O navegador nunca recebe a chave de API padrão da OpenAI; ele recebe apenas o client secret efêmero do Realtime. A voz realtime do Google Live é compatível com Voice Call no backend e pontes do Google Meet, mas ainda não com este caminho WebRTC no navegador. O prompt da sessão Realtime é montado pelo Gateway; `talk.realtime.session` não aceita substituições de instruções fornecidas pelo chamador.

    No compositor do Chat, o controle Talk é o botão de ondas ao lado do botão de ditado por microfone. Quando o Talk é iniciado, a linha de status do compositor mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta realtime consulta o modelo maior configurado por meio de `chat.send`.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Stop** (chama `chat.abort`).
    - Enquanto uma execução estiver ativa, acompanhamentos normais entram na fila. Clique em **Steer** em uma mensagem na fila para injetar esse acompanhamento no turno em execução.
    - Digite `/stop` (ou frases independentes de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.
  </Accordion>
  <Accordion title="Retenção parcial ao abortar">
    - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI.
    - O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer.
    - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição possam distinguir parciais abortados de saída normal concluída.
  </Accordion>
</AccordionGroup>

## Instalação de PWA e Web Push

A UI de controle inclui `manifest.webmanifest` e um service worker, então navegadores modernos podem instalá-la como uma PWA independente. O Web Push permite que o Gateway desperte a PWA instalada com notificações mesmo quando a aba ou a janela do navegador não está aberta.

| Superfície                                            | O que faz                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifesto da PWA. Os navegadores oferecem "Install app" assim que ela estiver acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (sob o diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar cargas do Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura do navegador persistidos.                 |

Substitua o par de chaves VAPID por meio de variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações com vários hosts, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `mailto:openclaw@localhost`)

A UI de controle usa estes métodos do Gateway com escopo controlado para registrar e testar assinaturas do navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
O Web Push é independente do caminho de relay APNS do iOS (consulte [Configuration](/pt-BR/gateway/configuration) para push com relay) e do método existente `push.test`, que têm como alvo o pareamento nativo móvel.
</Note>

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desabilita a execução de scripts dentro de embeds hospedados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interativos enquanto mantém isolamento de origem; este é o padrão e geralmente é suficiente para jogos/widgets de navegador autocontidos.
  </Tab>
  <Tab title="trusted">
    Adiciona `allow-same-origin` além de `allow-scripts` para documentos do mesmo site que intencionalmente precisam de privilégios mais fortes.
  </Tab>
</Tabs>

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

<Warning>
Use `trusted` apenas quando o documento incorporado realmente precisar de comportamento same-origin. Para a maioria dos jogos gerados por agentes e canvases interativos, `scripts` é a escolha mais segura.
</Warning>

URLs absolutas externas `http(s)` de embed continuam bloqueadas por padrão. Se você intencionalmente quiser que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Acesso à Tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, solicitações de Control UI/WebSocket via Serve podem se autenticar por cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o ao cabeçalho, e só aceita isso quando a solicitação atinge o loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da UI de controle com identidade de dispositivo do navegador, esse caminho Serve verificado também ignora a ida e volta de pareamento do dispositivo; navegadores sem dispositivo e conexões com papel de nó ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para tráfego via Serve. Então use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade do Serve, tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações de rate limit. Portanto, novas tentativas ruins concorrentes do mesmo navegador podem mostrar `retry later` na segunda solicitação, em vez de duas incompatibilidades simples competindo em paralelo.

    <Warning>
    A autenticação Serve sem token pressupõe que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular à tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Depois abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da UI (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador será executado em um **contexto não seguro** e bloqueará WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da UI de controle sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade de HTTP inseguro somente localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida de operador da UI de controle por meio de `gateway.auth.mode: "trusted-proxy"`
- opção de emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

<AccordionGroup>
  <Accordion title="Comportamento da opção de auth insegura">
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

    - Permite que sessões da UI de controle em localhost prossigam sem identidade de dispositivo em contextos HTTP não seguros.
    - Não ignora verificações de pareamento.
    - Não afrouxa requisitos de identidade de dispositivo remotos (não localhost).

  </Accordion>
  <Accordion title="Somente para emergência">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` desabilita verificações de identidade de dispositivo da UI de controle e é um rebaixamento severo de segurança. Reverta rapidamente após o uso em emergência.
    </Warning>

  </Accordion>
  <Accordion title="Observação sobre trusted-proxy">
    - Uma autenticação bem-sucedida via trusted-proxy pode admitir sessões de operador da UI de controle **sem** identidade de dispositivo.
    - Isso **não** se estende a sessões da UI de controle com papel de nó.
    - Proxies reversos em loopback no mesmo host ainda não satisfazem a autenticação trusted-proxy; consulte [Trusted proxy auth](/pt-BR/gateway/trusted-proxy-auth).
  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração de HTTPS.

## Content Security Policy

A UI de controle inclui uma política `img-src` restrita: apenas recursos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs remotas `http(s)` e URLs de imagem relativas a protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo `/avatars/<id>`) continuam sendo renderizados, incluindo rotas autenticadas de avatar que a UI busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` continuam sendo renderizadas (úteis para cargas dentro do protocolo).
- URLs `blob:` locais criadas pela UI de controle continuam sendo renderizadas.
- URLs remotas de avatar emitidas por metadados de canal são removidas pelos helpers de avatar da UI de controle e substituídas pelo logotipo/emblema integrado, de modo que um canal comprometido ou malicioso não possa forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa mudar nada para obter esse comportamento — ele está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da UI de controle exige o mesmo token do gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar apenas para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas a qualquer uma das rotas são rejeitadas (correspondendo à rota irmã de mídia do assistente). Isso evita que a rota de avatar vaze identidade do agente em hosts que de outra forma estariam protegidos.
- A própria UI de controle encaminha o token do gateway como cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem ainda seja renderizada em dashboards.

Se você desabilitar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também se torna não autenticada, em linha com o restante do gateway.

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quiser URLs de recursos fixas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para a URL WS do seu Gateway (por exemplo `ws://127.0.0.1:18789`).

## Depuração/teste: servidor de desenvolvimento + Gateway remoto

A UI de controle é composta de arquivos estáticos; o destino do WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite localmente, mas o Gateway é executado em outro lugar.

<Steps>
  <Step title="Inicie o servidor de desenvolvimento da UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Abra com gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    Autenticação única opcional (se necessário):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações">
    - `gatewayUrl` é armazenado em `localStorage` após o carregamento e removido da URL.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de requisição e no Referer. Parâmetros legados de query `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas em memória.
    - Quando `gatewayUrl` está definido, a UI não usa fallback para credenciais de configuração ou de ambiente. Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
    - Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` é aceito apenas em uma janela de nível superior (não incorporada) para evitar clickjacking.
    - Implantações de UI de controle fora de loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Isso inclui configurações remotas de desenvolvimento.
    - A inicialização do Gateway pode semear origens locais como `http://localhost:<port>` e `http://127.0.0.1:<port>` a partir do bind e da porta efetivos em runtime, mas origens remotas de navegador ainda exigem entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto em testes locais rigidamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder a qualquer host que eu estiver usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita o modo de fallback de origem por cabeçalho Host, mas esse é um modo de segurança perigoso.
  </Accordion>
</AccordionGroup>

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

## Relacionados

- [Dashboard](/pt-BR/web/dashboard) — dashboard do gateway
- [Health Checks](/pt-BR/gateway/health) — monitoramento de integridade do gateway
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
