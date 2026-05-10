---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada no navegador para o Gateway (chat, nós, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-05-10T19:54:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

A UI de Controle é um pequeno app de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da aba atual do navegador e a URL de gateway selecionada; senhas não são persistidas. O onboarding geralmente gera um token de gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à UI de Controle a partir de um novo navegador ou dispositivo, o Gateway geralmente exige uma **aprovação de pareamento única**. Esta é uma medida de segurança para impedir acesso não autorizado.

**O que você verá:** "desconectado (1008): pareamento necessário"

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

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute novamente `openclaw devices list` antes da aprovação.

Se o navegador já estiver pareado e você alterá-lo de acesso de leitura para acesso de gravação/administração, isso será tratado como uma atualização de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

<Note>
- Conexões diretas do navegador por local loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode pular a ida e volta de pareamento para sessões de operador da UI de Controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Vínculos diretos de Tailnet, conexões de navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo único, portanto trocar de navegador ou limpar os dados do navegador exigirá novo pareamento.

</Note>

## Identidade pessoal (local do navegador)

A UI de Controle oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada às mensagens de saída para atribuição em sessões compartilhadas. Ela fica no armazenamento do navegador, é limitada ao perfil atual do navegador e não é sincronizada com outros dispositivos nem persistida no servidor, além dos metadados normais de autoria da transcrição nas mensagens que você realmente envia. Limpar os dados do site ou trocar de navegador a redefine para vazio.

O mesmo padrão local do navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca fazem ida e volta por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` ainda está disponível para clientes que não sejam da UI e escrevam o campo diretamente (como gateways com scripts ou dashboards personalizados).

## Endpoint de configuração de runtime

A UI de Controle busca suas configurações de runtime em `/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma autenticação de gateway que o restante da superfície HTTP: navegadores não autenticados não podem buscá-lo, e uma busca bem-sucedida exige um token/senha de gateway já válido, identidade do Tailscale Serve ou identidade de proxy confiável.

## Suporte a idiomas

A UI de Controle pode se localizar no primeiro carregamento com base no locale do navegador. Para substituí-lo depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de locale fica no cartão Acesso ao Gateway, não em Aparência.

- Locales compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Traduções que não sejam em inglês são carregadas sob demanda no navegador.
- O locale selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

As traduções da documentação são geradas para o mesmo conjunto de locales que não sejam em inglês, mas o seletor de idioma integrado do site de documentação do Mintlify é limitado aos códigos de locale que o Mintlify aceita. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência mantém os temas integrados Claw, Knot e Dash, além de um slot de importação tweakcn local do navegador. Para importar um tema, abra o [editor do tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Compartilhar** e cole o link do tema copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs do editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs de tema brutos e nomes de tema padrão, como `amethyst-haze`.

Temas importados são armazenados apenas no perfil atual do navegador. Eles não são gravados na configuração do gateway e não são sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo muda o tema ativo de volta para Claw se o tema importado estava selecionado.

## O que ele pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Bate-papo e conversa por voz">
    - Converse com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Atualizações do histórico de bate-papo solicitam uma janela recente limitada com limites de texto por mensagem, para que sessões grandes não forcem o navegador a renderizar uma carga completa de transcrição antes que o bate-papo fique utilizável.
    - Converse por voz por meio de sessões em tempo real do navegador. A OpenAI usa WebRTC direto, o Google Live usa um token de navegador restrito de uso único por WebSocket, e Plugins de voz em tempo real somente de backend usam o transporte de retransmissão do Gateway. Sessões de provedor de propriedade do cliente começam com `talk.client.create`; sessões de retransmissão do Gateway começam com `talk.session.create`. A retransmissão mantém as credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por `talk.session.appendAudio` e encaminha chamadas de ferramenta de provedor `openclaw_agent_consult` por `talk.client.toolCall` para a política do Gateway e o modelo OpenClaw configurado maior.
    - Transmita chamadas de ferramenta + cartões de saída de ferramenta ao vivo no bate-papo (eventos do agente).

  </Accordion>
  <Accordion title="Canais, instâncias, sessões, dreams">
    - Canais: status de canais integrados e de Plugins agrupados/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Atualizações de sondagem de canal mantêm o snapshot anterior visível enquanto verificações lentas de provedor terminam, e snapshots parciais são rotulados quando uma sondagem ou auditoria excede seu orçamento de UI.
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: liste por padrão sessões de agentes configurados, faça fallback a partir de chaves obsoletas de sessão de agente não configurado e aplique substituições por sessão de modelo/thinking/rápido/verboso/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Dreams: status de Dreaming, alternância de ativar/desativar e leitor do Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nós, aprovações de exec">
    - Tarefas Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`).
    - Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`).
    - Nós: lista + limites (`node.list`).
    - Aprovações de exec: edite allowlists de gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuração">
    - Veja/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplique + reinicie com validação (`config.apply`) e acorde a última sessão ativa.
    - Gravações incluem uma proteção por hash base para evitar sobrescrever edições concorrentes.
    - Gravações (`config.set`/`config.apply`/`config.patch`) fazem preflight da resolução de SecretRef ativa para refs no payload de configuração enviado; refs enviadas ativas não resolvidas são rejeitadas antes da gravação.
    - Renderização de esquema + formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos de filhos imediatos, metadados de documentação em nós aninhados de objeto/coringa/array/composição, além de esquemas de Plugin + canal quando disponíveis); o editor JSON bruto fica disponível somente quando o snapshot tem uma ida e volta bruta segura.
    - Se um snapshot não puder fazer ida e volta segura de texto bruto, a UI de Controle força o modo Formulário e desabilita o modo Bruto para esse snapshot.
    - O editor JSON bruto "Redefinir para salvo" preserva o formato criado em bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer ida e volta com segurança.
    - Valores estruturados de objeto SecretRef são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string.

  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui tempos de atualização/RPC da UI de Controle, tempos lentos de renderização de chat/configuração e entradas de responsividade do navegador para longos quadros de animação ou tarefas longas quando o navegador expõe esses tipos de entrada PerformanceObserver.
    - Logs: acompanhamento ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git + reinicialização (`update.run`) com um relatório de reinicialização e depois consulte `update.status` após reconectar para verificar a versão do gateway em execução.

  </Accordion>
  <Accordion title="Observações do painel de tarefas Cron">
    - Para tarefas isoladas, a entrega usa anúncio de resumo por padrão. Você pode alternar para nenhuma se quiser execuções apenas internas.
    - Campos de canal/destino aparecem quando anúncio está selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de webhook HTTP(S) válida.
    - Para tarefas de sessão principal, os modos de entrega webhook e nenhuma estão disponíveis.
    - Controles avançados de edição incluem excluir após execução, limpar substituição de agente, opções cron exatas/escalonadas, substituições de modelo/thinking do agente e alternâncias de entrega por melhor esforço.
    - A validação do formulário é inline com erros em nível de campo; valores inválidos desabilitam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook será enviado sem um cabeçalho de autenticação.
    - Fallback obsoleto: tarefas legadas armazenadas com `notify: true` ainda podem usar `cron.webhook` até serem migradas.

  </Accordion>
</AccordionGroup>

## Comportamento do bate-papo

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
    - Uploads de chat aceitam imagens e arquivos que não sejam vídeos. Imagens mantêm o caminho nativo da imagem; outros arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexo.
    - Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução, e `{ status: "ok" }` após a conclusão.
    - As respostas de `chat.history` têm limite de tamanho para segurança da UI. Quando entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Imagens geradas/do assistente são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, de modo que recarregamentos não dependam de payloads brutos de imagem em base64 permanecerem na resposta do histórico de chat.
    - Ao renderizar `chat.history`, a Control UI remove tags de diretiva inline apenas de exibição do texto visível do assistente (por exemplo, `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), e tokens vazados de controle do modelo em ASCII/largura completa, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply` ou o token de confirmação de Heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém mensagens locais otimistas do usuário/assistente visíveis se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais assim que o histórico do Gateway alcança o estado atual.
    - Eventos `chat` ao vivo são estado de entrega, enquanto `chat.history` é reconstruído a partir da transcrição durável da sessão. Após eventos finais de ferramenta, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição está documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` acrescenta uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas de UI (sem execução de agente, sem entrega de canal).
    - O cabeçalho do chat mostra o filtro de agente antes do seletor de sessão, e o seletor de sessão é escopado pelo agente selecionado. Alternar agentes mostra apenas sessões vinculadas a esse agente e recorre à sessão principal desse agente quando ele ainda não tem sessões de dashboard salvas.
    - Em larguras de desktop, os controles de chat permanecem em uma linha compacta e recolhem ao rolar a transcrição para baixo; rolar para cima, voltar ao topo ou chegar ao fim restaura os controles.
    - Mensagens consecutivas duplicadas somente de texto são renderizadas como uma única bolha com um selo de contagem. Mensagens que contêm imagens, anexos, saída de ferramenta ou prévias de canvas não são recolhidas.
    - Os seletores de modelo e thinking no cabeçalho do chat aplicam patch à sessão ativa imediatamente por meio de `sessions.patch`; eles são substituições persistentes da sessão, não opções de envio apenas para uma rodada.
    - Se você enviar uma mensagem enquanto uma alteração no seletor de modelo para a mesma sessão ainda estiver sendo salva, o composer aguarda esse patch da sessão antes de chamar `chat.send`, para que o envio use o modelo selecionado.
    - Digitar `/new` na Control UI cria e alterna para a mesma sessão nova de dashboard que New Chat, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, ela redefine a sessão principal no lugar. Digitar `/reset` mantém a redefinição explícita no lugar do Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada do Gateway. Se `agents.defaults.models` estiver presente, essa allowlist alimenta o seletor, incluindo entradas `provider/*` que mantêm catálogos escopados por provedor dinâmicos. Caso contrário, o seletor mostra entradas explícitas de `models.providers.*.models` mais provedores com autenticação utilizável. O catálogo completo continua disponível pelo RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios recentes de uso da sessão do Gateway incluem tokens de contexto atuais, a área do composer do chat mostra um indicador compacto de uso de contexto. Ele muda para o estilo de aviso sob alta pressão de contexto e, em níveis recomendados de Compaction, mostra um botão compacto que executa o caminho normal de Compaction da sessão. Snapshots de tokens obsoletos ficam ocultos até o Gateway relatar uso recente novamente.

  </Accordion>
  <Accordion title="Modo Talk (tempo real no navegador)">
    O modo Talk usa um provedor de voz em tempo real registrado. Configure OpenAI com `talk.realtime.provider: "openai"` mais `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` ou um perfil OAuth `openai-codex`; configure Google com `talk.realtime.provider: "google"` mais `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API padrão do provedor. OpenAI recebe um segredo efêmero de cliente Realtime para WebRTC. Google Live recebe um token de autenticação de Live API restrito e de uso único para uma sessão WebSocket do navegador, com instruções e declarações de ferramentas travadas no token pelo Gateway. Provedores que expõem apenas uma ponte de tempo real no backend passam pelo transporte de relay do Gateway, para que credenciais e sockets de fornecedores permaneçam no lado do servidor enquanto o áudio do navegador passa por RPCs autenticados do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instruções fornecidas pelo chamador.

    O composer do Chat inclui um botão de opções de Talk ao lado do botão de iniciar/parar Talk. As opções se aplicam à próxima sessão de Talk e podem substituir provedor, transporte, modelo, voz, esforço de raciocínio, limiar de VAD, duração de silêncio e preenchimento de prefixo. Quando uma opção está em branco, o Gateway usa os padrões configurados quando disponíveis ou o padrão do provedor. Selecionar relay do Gateway força o caminho de relay do backend; selecionar WebRTC mantém a sessão pertencente ao cliente e falha em vez de recorrer silenciosamente ao relay se o provedor não conseguir criar uma sessão de navegador.

    No composer do Chat, o controle de Talk é o botão de ondas ao lado do botão de ditado por microfone. Quando Talk inicia, a linha de status do composer mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por meio de `talk.client.toolCall`.

    Smoke ao vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a ponte WebSocket de backend da OpenAI, a troca SDP de WebRTC do navegador da OpenAI, a configuração de WebSocket do navegador com token restrito do Google Live e o adaptador de navegador de relay do Gateway com mídia falsa de microfone. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Stop** (chama `chat.abort`).
    - Enquanto uma execução está ativa, acompanhamentos normais entram na fila. Clique em **Steer** em uma mensagem enfileirada para injetar esse acompanhamento na rodada em execução.
    - Digite `/stop` (ou frases autônomas de abortar como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial ao abortar">
    - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI.
    - O Gateway persiste texto parcial abortado do assistente no histórico de transcrição quando existe saída em buffer.
    - Entradas persistidas incluem metadados de abort para que consumidores de transcrição possam diferenciar parciais abortadas da saída de conclusão normal.

  </Accordion>
</AccordionGroup>

## Instalação de PWA e push web

A Control UI inclui um `manifest.webmanifest` e um service worker, para que navegadores modernos possam instalá-la como uma PWA independente. Web Push permite que o Gateway acorde a PWA instalada com notificações mesmo quando a aba ou a janela do navegador não está aberta.

| Superfície                                            | O que faz                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto PWA. Navegadores oferecem "Instalar app" quando ele está acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (sob o diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar payloads de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura do navegador persistidos.                  |

Substitua o par de chaves VAPID por variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações multi-host, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `mailto:openclaw@localhost`)

A Control UI usa estes métodos do Gateway com escopo controlado para registrar e testar assinaturas do navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
Web Push é independente do caminho de relay iOS APNS (veja [Configuração](/pt-BR/gateway/configuration) para push apoiado por relay) e do método `push.test` existente, que miram o pareamento móvel nativo.
</Note>

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desativa a execução de scripts dentro de embeds hospedados.
  </Tab>
  <Tab title="scripts (padrão)">
    Permite embeds interativos mantendo o isolamento de origem; este é o padrão e geralmente basta para jogos/widgets de navegador autocontidos.
  </Tab>
  <Tab title="trusted">
    Adiciona `allow-same-origin` além de `allow-scripts` para documentos no mesmo site que precisam intencionalmente de privilégios mais fortes.
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
Use `trusted` somente quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos gerados por agentes e canvases interativos, `scripts` é a escolha mais segura.
</Warning>

URLs externas absolutas de embed `http(s)` continuam bloqueadas por padrão. Se você quiser intencionalmente que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura da mensagem de chat

Mensagens de chat agrupadas usam uma largura máxima padrão legível. Implantações em monitores largos podem substituí-la sem aplicar patch ao CSS empacotado definindo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

O valor é validado antes de chegar ao navegador. Valores aceitos incluem comprimentos simples e porcentagens como `960px` ou `82%`, além de expressões de largura restritas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Acesso à tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferencial)">
    Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy dele com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, as solicitações Serve da UI de controle/WebSocket podem autenticar via cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o com o cabeçalho, e só aceita essas solicitações quando elas chegam ao loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da UI de controle com identidade de dispositivo do navegador, esse caminho Serve verificado também ignora a ida e volta de pareamento do dispositivo; navegadores sem dispositivo e conexões de função de nó ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para tráfego Serve. Em seguida, use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade Serve, tentativas de autenticação malsucedidas para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações de limite de taxa. Portanto, novas tentativas incorretas simultâneas do mesmo navegador podem mostrar `retry later` na segunda solicitação em vez de duas incompatibilidades simples concorrendo em paralelo.

    <Warning>
    A autenticação Serve sem token presume que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular à tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Em seguida, abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da UI (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o painel por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador será executado em um **contexto não seguro** e bloqueará o WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da UI de controle sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade com HTTP inseguro somente em localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da UI de controle do operador por meio de `gateway.auth.mode: "trusted-proxy"`
- medida emergencial `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

<AccordionGroup>
  <Accordion title="Comportamento da alternância de autenticação insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` é apenas uma alternância de compatibilidade local:

    - Ela permite que sessões da UI de controle em localhost prossigam sem identidade de dispositivo em contextos HTTP não seguros.
    - Ela não ignora verificações de pareamento.
    - Ela não flexibiliza requisitos de identidade de dispositivo remotos (não localhost).

  </Accordion>
  <Accordion title="Somente medida emergencial">
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
    `dangerouslyDisableDeviceAuth` desativa verificações de identidade de dispositivo da UI de controle e é uma redução grave de segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy confiável">
    - A autenticação trusted-proxy bem-sucedida pode admitir sessões da UI de controle de **operador** sem identidade de dispositivo.
    - Isso **não** se estende a sessões da UI de controle de função de nó.
    - Proxies reversos de loopback no mesmo host ainda não satisfazem a autenticação trusted-proxy; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração de HTTPS.

## Política de segurança de conteúdo

A UI de controle é distribuída com uma política `img-src` rigorosa: apenas ativos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagem remotas `http(s)` e relativas a protocolo são rejeitadas pelo navegador e não disparam buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) ainda são renderizados, incluindo rotas de avatar autenticadas que a UI busca e converte em URLs `blob:` locais.
- URLs `data:image/...` inline ainda são renderizadas (úteis para cargas em protocolo).
- URLs `blob:` locais criadas pela UI de controle ainda são renderizadas.
- URLs remotas de avatar emitidas por metadados de canal são removidas nos auxiliares de avatar da UI de controle e substituídas pelo logotipo/selo integrado, para que um canal comprometido ou malicioso não possa forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativo e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da UI de controle exige o mesmo token de gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar apenas para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas a qualquer uma das rotas são rejeitadas (igual à rota irmã assistant-media). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estão protegidos.
- A própria UI de controle encaminha o token do gateway como cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem ainda seja renderizada em painéis.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também ficará não autenticada, em linha com o restante do gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do gateway está configurada, pré-visualizações de mídia local do assistente usam uma rota em duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da UI de controle. O navegador envia o token do gateway como cabeçalho bearer ao verificar disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração restrito a esse caminho de origem exato.
- URLs de imagem, áudio, vídeo e documento renderizadas pelo navegador usam `mediaTicket=<ticket>` em vez do token ou senha ativos do gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

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

Em seguida, aponte a UI para sua URL WS do Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A UI de controle é composta por arquivos estáticos; o destino WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento do Vite localmente, mas o Gateway é executado em outro lugar.

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

    Autenticação opcional de uso único (se necessário):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas">
    - `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
    - Se você passar um endpoint completo `ws://` ou `wss://` via `gatewayUrl`, codifique o valor de `gatewayUrl` na URL para que o navegador analise corretamente a string de consulta.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de solicitação e Referer. Parâmetros de consulta legados `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas na memória.
    - Quando `gatewayUrl` está definido, a UI não recorre a credenciais de configuração ou ambiente. Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
    - Use `wss://` quando o Gateway estiver por trás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
    - Implantações da UI de controle sem loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Isso inclui configurações de desenvolvimento remoto.
    - A inicialização do Gateway pode semear origens locais como `http://localhost:<port>` e `http://127.0.0.1:<port>` a partir do bind e da porta efetivos em tempo de execução, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto para testes locais rigidamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder ao host que estou usando".
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

## Relacionados

- [Painel](/pt-BR/web/dashboard) — painel do gateway
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento da integridade do gateway
- [TUI](/pt-BR/web/tui) — interface de usuário no terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
