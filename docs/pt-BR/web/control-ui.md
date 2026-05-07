---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada em navegador para o Gateway (chat, nós, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-05-07T13:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

A Interface de Controle é um pequeno aplicativo de página única **Vite + Lit** servido pelo Gateway:

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

O painel de configurações do dashboard mantém um token para a sessão atual da aba do navegador e a URL do gateway selecionada; senhas não são persistidas. O onboarding geralmente gera um token de gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Interface de Controle a partir de um novo navegador ou dispositivo, o Gateway geralmente exige uma **aprovação de pareamento única**. Esta é uma medida de segurança para impedir acesso não autorizado.

**O que você verá:** "desconectado (1008): pareamento obrigatório"

<Steps>
  <Step title="Listar solicitações pendentes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprovar por ID da solicitação">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se o navegador tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute `openclaw devices list` novamente antes da aprovação.

Se o navegador já estiver pareado e você alterá-lo de acesso de leitura para acesso de gravação/admin, isso será tratado como um upgrade de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla e solicita que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de Dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

<Note>
- Conexões diretas de navegador via local loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode pular a ida e volta de pareamento para sessões de operador da Interface de Controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Vinculações diretas de Tailnet, conexões de navegador via LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo único, portanto trocar de navegador ou limpar os dados do navegador exigirá novo pareamento.

</Note>

## Identidade pessoal (local do navegador)

O Control UI oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada às mensagens enviadas para atribuição em sessões compartilhadas. Ela fica no armazenamento do navegador, é limitada ao perfil atual do navegador e não é sincronizada com outros dispositivos nem persistida no lado do servidor além dos metadados normais de autoria do transcript nas mensagens que você realmente envia. Limpar os dados do site ou trocar de navegador a redefine para vazio.

O mesmo padrão local do navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca fazem ida e volta por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` continua disponível para clientes que não são UI e gravam o campo diretamente (como gateways com scripts ou painéis personalizados).

## Endpoint de configuração de runtime

O Control UI busca suas configurações de runtime em `/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não conseguem buscá-lo, e uma busca bem-sucedida exige um token/senha de gateway já válido, uma identidade do Tailscale Serve ou uma identidade de proxy confiável.

## Suporte a idiomas

O Control UI pode se localizar na primeira carga com base no locale do seu navegador. Para substituí-lo depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de locale fica no cartão Acesso ao Gateway, não em Aparência.

- Locales com suporte: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Traduções que não são em inglês são carregadas sob demanda no navegador.
- O locale selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes usam inglês como fallback.

As traduções da documentação são geradas para o mesmo conjunto de locales que não são em inglês, mas o seletor de idiomas integrado do site de documentação no Mintlify é limitado aos códigos de locale que o Mintlify aceita. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência mantém os temas integrados Claw, Knot e Dash, além de um slot de importação tweakcn local do navegador. Para importar um tema, abra o [editor tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Compartilhar** e cole o link do tema copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs de editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs de tema brutos e nomes de tema padrão como `amethyst-haze`.

Temas importados são armazenados apenas no perfil atual do navegador. Eles não são gravados na configuração do gateway e não são sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo muda o tema ativo de volta para Claw se o tema importado estava selecionado.

## O que ele pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Chat e conversa">
    - Converse com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Atualizações do histórico de chat solicitam uma janela recente limitada com limites de texto por mensagem para que sessões grandes não obriguem o navegador a renderizar um payload completo de transcript antes que o chat fique utilizável.
    - Fale por sessões em tempo real do navegador. A OpenAI usa WebRTC direto, o Google Live usa um token de navegador restrito de uso único sobre WebSocket, e plugins de voz em tempo real somente de backend usam o transporte de relay do Gateway. Sessões de provedor de propriedade do cliente começam com `talk.client.create`; sessões de relay do Gateway começam com `talk.session.create`. O relay mantém as credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por `talk.session.appendAudio` e encaminha chamadas de ferramenta do provedor `openclaw_agent_consult` por `talk.client.toolCall` para a política do Gateway e o modelo OpenClaw configurado maior.
    - Transmita chamadas de ferramenta + cartões de saída de ferramenta ao vivo no Chat (eventos do agente).

  </Accordion>
  <Accordion title="Canais, instâncias, sessões, sonhos">
    - Canais: status de canais integrados mais canais de Plugin empacotados/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Atualizações de sondagem de canal mantêm o snapshot anterior visível enquanto verificações lentas de provedor terminam, e snapshots parciais são rotulados quando uma sondagem ou auditoria excede seu orçamento de UI.
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: lista sessões de agentes configurados por padrão, usa fallback a partir de chaves obsoletas de sessão de agente não configurado e aplica substituições por sessão de modelo/raciocínio/rápido/verboso/rastreamento/reasoning (`sessions.list`, `sessions.patch`).
    - Sonhos: status de Dreaming, alternância para ativar/desativar e leitor do Diário de Sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nós, aprovações de execução">
    - Tarefas Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`).
    - Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`).
    - Nós: lista + capacidades (`node.list`).
    - Aprovações de execução: editar allowlists de gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuração">
    - Visualize/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplique + reinicie com validação (`config.apply`) e acorde a última sessão ativa.
    - Gravações incluem uma proteção de hash base para impedir sobrescrever edições concorrentes.
    - Gravações (`config.set`/`config.apply`/`config.patch`) pré-verificam a resolução de SecretRef ativo para refs no payload de configuração enviado; refs enviados ativos não resolvidos são rejeitados antes da gravação.
    - Renderização de esquema + formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` do campo, dicas de UI correspondentes, resumos de filhos imediatos, metadados de documentação em nós aninhados de objeto/wildcard/array/composição, além de esquemas de Plugin + canal quando disponíveis); o editor de JSON bruto só fica disponível quando o snapshot tem uma ida e volta bruta segura.
    - Se um snapshot não puder fazer ida e volta segura de texto bruto, o Control UI força o modo Formulário e desativa o modo Bruto para esse snapshot.
    - O editor de JSON bruto "Redefinir para salvo" preserva o formato criado em bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, então edições externas sobrevivem a uma redefinição quando o snapshot pode fazer ida e volta com segurança.
    - Valores de objeto SecretRef estruturados são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string.

  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui tempos de atualização/RPC do Control UI, tempos lentos de renderização de chat/configuração e entradas de responsividade do navegador para quadros de animação longos ou tarefas longas quando o navegador expõe esses tipos de entrada PerformanceObserver.
    - Logs: cauda ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git + reinicialização (`update.run`) com um relatório de reinicialização, depois faça polling de `update.status` após reconectar para verificar a versão do gateway em execução.

  </Accordion>
  <Accordion title="Notas do painel de tarefas Cron">
    - Para tarefas isoladas, a entrega usa por padrão o anúncio de resumo. Você pode mudar para nenhuma se quiser execuções apenas internas.
    - Campos de canal/alvo aparecem quando anunciar é selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de webhook HTTP(S) válida.
    - Para tarefas de sessão principal, os modos de entrega webhook e nenhuma estão disponíveis.
    - Controles de edição avançados incluem excluir após executar, limpar substituição de agente, opções cron exatas/escalonadas, substituições de modelo/raciocínio do agente e alternâncias de entrega em melhor esforço.
    - A validação do formulário é inline, com erros no nível do campo; valores inválidos desativam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
    - Fallback obsoleto: tarefas legadas armazenadas com `notify: true` ainda podem usar `cron.webhook` até serem migradas.

  </Accordion>
</AccordionGroup>

## Comportamento do chat

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
    - Uploads de chat aceitam imagens e arquivos que não sejam vídeos. Imagens mantêm o caminho de imagem nativo; outros arquivos são armazenados como mídia gerenciada e mostrados no histórico como links de anexo.
    - Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto está em execução, e `{ status: "ok" }` após a conclusão.
    - Respostas de `chat.history` têm limite de tamanho para segurança da UI. Quando entradas de transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos de metadados pesados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Imagens assistentes/geradas são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, então recarregamentos não dependem de payloads brutos de imagem em base64 continuarem na resposta do histórico de chat.
    - Ao renderizar `chat.history`, a Control UI remove tags de diretiva inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos de chamada de ferramenta truncados), e tokens de controle de modelo ASCII/largura total vazados, e omite entradas de assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply` ou o token de confirmação de Heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização de chat mantém mensagens locais otimistas de usuário/assistente visíveis se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais assim que o histórico do Gateway alcança o estado atual.
    - Eventos `chat` ao vivo são estado de entrega, enquanto `chat.history` é reconstruído a partir da transcrição durável da sessão. Após eventos finais de ferramenta, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição está documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` acrescenta uma nota de assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas de UI (sem execução de agente, sem entrega de canal).
    - O cabeçalho do chat mostra o filtro de agente antes do seletor de sessão, e o seletor de sessão é escopado pelo agente selecionado. Trocar agentes mostra apenas sessões vinculadas a esse agente e volta para a sessão principal desse agente quando ele ainda não tem sessões de dashboard salvas.
    - Em larguras de desktop, os controles de chat permanecem em uma única linha compacta e recolhem ao rolar para baixo na transcrição; rolar para cima, voltar ao topo ou chegar ao fim restaura os controles.
    - Mensagens consecutivas duplicadas somente de texto são renderizadas como uma bolha com um selo de contagem. Mensagens que carregam imagens, anexos, saída de ferramenta ou prévias de canvas não são recolhidas.
    - Os seletores de modelo e raciocínio do cabeçalho do chat aplicam patch à sessão ativa imediatamente por `sessions.patch`; são substituições persistentes de sessão, não opções de envio válidas apenas por uma rodada.
    - Digitar `/new` na Control UI cria e alterna para a mesma sessão nova de dashboard que New Chat. Digitar `/reset` mantém a redefinição explícita in-place do Gateway para a sessão atual.
    - O seletor de modelo de chat solicita a visualização de modelo configurada do Gateway. Se `agents.defaults.models` estiver presente, essa allowlist orienta o seletor. Caso contrário, o seletor mostra entradas explícitas de `models.providers.*.models` e provedores com autenticação utilizável. O catálogo completo permanece disponível pelo RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios recentes de uso de sessão do Gateway incluem tokens de contexto atuais, a área do compositor de chat mostra um indicador compacto de uso de contexto. Ele muda para estilo de aviso sob alta pressão de contexto e, em níveis recomendados de Compaction, mostra um botão compacto que executa o caminho normal de Compaction da sessão. Snapshots de token obsoletos ficam ocultos até o Gateway relatar uso recente novamente.

  </Accordion>
  <Accordion title="Modo de conversa (tempo real no navegador)">
    O modo de conversa usa um provedor de voz em tempo real registrado. Configure a OpenAI com `talk.realtime.provider: "openai"` e `talk.realtime.providers.openai.apiKey`, ou configure o Google com `talk.realtime.provider: "google"` e `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API padrão do provedor. A OpenAI recebe um segredo efêmero de cliente Realtime para WebRTC. O Google Live recebe um token de autenticação da Live API restrito e de uso único para uma sessão WebSocket de navegador, com instruções e declarações de ferramentas bloqueadas no token pelo Gateway. Provedores que expõem apenas uma ponte de tempo real no backend passam pelo transporte de relay do Gateway, então credenciais e sockets do fornecedor permanecem no servidor enquanto o áudio do navegador trafega por RPCs autenticados do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instrução fornecidas pelo chamador.

    No compositor de Chat, o controle Talk é o botão de ondas ao lado do botão de ditado por microfone. Quando Talk inicia, a linha de status do compositor mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por `talk.client.toolCall`.

    Smoke ao vivo de mantenedor: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a troca de SDP WebRTC de navegador da OpenAI, a configuração WebSocket de navegador com token restrito do Google Live e o adaptador de navegador do relay do Gateway com mídia falsa de microfone. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Parar** (chama `chat.abort`).
    - Enquanto uma execução está ativa, acompanhamentos normais entram em fila. Clique em **Direcionar** em uma mensagem enfileirada para injetar esse acompanhamento na rodada em execução.
    - Digite `/stop` (ou frases autônomas de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial ao abortar">
    - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI.
    - O Gateway persiste texto parcial abortado do assistente no histórico de transcrição quando há saída em buffer.
    - Entradas persistidas incluem metadados de aborto para que consumidores de transcrição possam diferenciar partes parciais abortadas de saída de conclusão normal.

  </Accordion>
</AccordionGroup>

## Instalação PWA e push web

A Control UI inclui um `manifest.webmanifest` e um service worker, então navegadores modernos podem instalá-la como uma PWA independente. Web Push permite que o Gateway desperte a PWA instalada com notificações mesmo quando a aba ou janela do navegador não está aberta.

| Superfície                                            | O que faz                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto PWA. Navegadores oferecem "Instalar app" quando ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (no diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar payloads Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura de navegador persistidos.                  |

Substitua o par de chaves VAPID por variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações multi-host, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (padrão: `mailto:openclaw@localhost`)

A Control UI usa estes métodos do Gateway protegidos por escopo para registrar e testar assinaturas de navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` e `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
Web Push é independente do caminho de relay APNS do iOS (veja [Configuração](/pt-BR/gateway/configuration) para push com relay) e do método `push.test` existente, que tem como alvo o pareamento móvel nativo.
</Note>

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desativa a execução de scripts dentro de embeds hospedados.
  </Tab>
  <Tab title="scripts (padrão)">
    Permite embeds interativos enquanto mantém isolamento de origem; este é o padrão e geralmente basta para jogos/widgets de navegador autocontidos.
  </Tab>
  <Tab title="trusted">
    Adiciona `allow-same-origin` sobre `allow-scripts` para documentos do mesmo site que precisam intencionalmente de privilégios mais fortes.
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
Use `trusted` apenas quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos gerados por agentes e canvases interativos, `scripts` é a escolha mais segura.
</Warning>

URLs absolutas externas de embed `http(s)` permanecem bloqueadas por padrão. Se você quiser intencionalmente que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura da mensagem de chat

Mensagens de chat agrupadas usam uma max-width padrão legível. Implantações em monitores largos podem substituí-la sem aplicar patch ao CSS empacotado definindo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

O valor é validado antes de chegar ao navegador. Valores compatíveis incluem comprimentos simples e porcentagens como `960px` ou `82%`, além de expressões de largura restritas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Acesso tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy dele com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, solicitações Serve da Control UI/WebSocket podem autenticar por cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o ao cabeçalho, e só aceita esses cabeçalhos quando a solicitação atinge loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da Control UI com identidade de dispositivo do navegador, este caminho Serve verificado também pula a ida e volta de pareamento de dispositivo; navegadores sem dispositivo e conexões com função de nó ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para tráfego Serve. Então use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade Serve, tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes de gravações de limite de taxa. Portanto, retentativas inválidas concorrentes do mesmo navegador podem mostrar `retry later` na segunda solicitação em vez de duas incompatibilidades simples disputando em paralelo.

    <Warning>
    Autenticação Serve sem token pressupõe que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular à tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Então abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da UI (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o painel via HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador será executado em um **contexto não seguro** e bloqueará WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da UI de Controle sem identidade do dispositivo.

Exceções documentadas:

- compatibilidade com HTTP inseguro somente em localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da UI de Controle do operador por meio de `gateway.auth.mode: "trusted-proxy"`
- emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

<AccordionGroup>
  <Accordion title="Comportamento do seletor de autenticação insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` é apenas um seletor de compatibilidade local:

    - Ele permite que sessões da UI de Controle em localhost prossigam sem identidade do dispositivo em contextos HTTP não seguros.
    - Ele não ignora verificações de pareamento.
    - Ele não relaxa os requisitos de identidade do dispositivo remoto (não localhost).

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
    `dangerouslyDisableDeviceAuth` desativa as verificações de identidade do dispositivo da UI de Controle e é uma redução severa de segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Observação sobre trusted-proxy">
    - A autenticação trusted-proxy bem-sucedida pode admitir sessões da UI de Controle do **operador** sem identidade do dispositivo.
    - Isso **não** se estende a sessões da UI de Controle com função de nó.
    - Proxies reversos de loopback no mesmo host ainda não satisfazem a autenticação trusted-proxy; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração de HTTPS.

## Política de segurança de conteúdo

A UI de Controle vem com uma política `img-src` rigorosa: somente ativos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagem remotas `http(s)` e relativas a protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) ainda são renderizados, incluindo rotas de avatar autenticadas que a UI busca e converte em URLs `blob:` locais.
- URLs `data:image/...` inline ainda são renderizadas (útil para cargas úteis em protocolo).
- URLs `blob:` locais criadas pela UI de Controle ainda são renderizadas.
- URLs de avatar remotas emitidas por metadados de canais são removidas nos helpers de avatar da UI de Controle e substituídas pelo logotipo/selo integrado, para que um canal comprometido ou malicioso não possa forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da UI de Controle exige o mesmo token de gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (correspondendo à rota irmã de mídia do assistente). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estejam protegidos.
- A própria UI de Controle encaminha o token do gateway como um cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem ainda seja renderizada nos painéis.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também deixa de exigir autenticação, em linha com o restante do gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do gateway está configurada, as pré-visualizações de mídia local do assistente usam uma rota em duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da UI de Controle. O navegador envia o token do gateway como um cabeçalho bearer ao verificar a disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração limitado ao caminho de origem exato.
- URLs de imagem, áudio, vídeo e documento renderizadas pelo navegador usam `mediaTicket=<ticket>` em vez do token ou senha ativo do gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

Isso mantém a renderização normal de mídia compatível com elementos de mídia nativos do navegador sem colocar credenciais reutilizáveis do gateway em URLs de mídia visíveis.

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quiser URLs de ativos fixas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para sua URL WS do Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Depuração/teste: servidor de desenvolvimento + Gateway remoto

A UI de Controle é composta por arquivos estáticos; o destino do WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite localmente, mas o Gateway é executado em outro lugar.

<Steps>
  <Step title="Inicie o servidor de desenvolvimento da UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Abra com gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autenticação opcional única (se necessário):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações">
    - `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
    - Se você passar um endpoint completo `ws://` ou `wss://` via `gatewayUrl`, codifique o valor de `gatewayUrl` como URL para que o navegador analise corretamente a string de consulta.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de solicitação e Referer. Parâmetros de consulta legados `?token=` ainda são importados uma vez para compatibilidade, mas somente como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas na memória.
    - Quando `gatewayUrl` está definido, a UI não recorre a credenciais de configuração ou ambiente. Forneça `token` (ou `password`) explicitamente. Credenciais explícitas ausentes são um erro.
    - Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
    - Implantações da UI de Controle sem loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Isso inclui configurações de desenvolvimento remoto.
    - A inicialização do Gateway pode semear origens locais como `http://localhost:<port>` e `http://127.0.0.1:<port>` a partir do bind e da porta efetivos de runtime, mas origens de navegador remotas ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]`, exceto para testes locais estritamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder ao host que estou usando."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita o modo de fallback de origem por cabeçalho Host, mas é um modo de segurança perigoso.

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

Detalhes de configuração de acesso remoto: [Acesso remoto](/pt-BR/gateway/remote).

## Relacionado

- [Dashboard](/pt-BR/web/dashboard) — painel do gateway
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento de integridade do gateway
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
