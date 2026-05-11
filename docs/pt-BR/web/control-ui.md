---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada em navegador para o Gateway (chat, nós, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-05-11T20:38:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

A UI de Controle é um pequeno aplicativo de página única **Vite + Lit** servido pelo Gateway:

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

O painel de configurações do dashboard mantém um token para a sessão atual da aba do navegador e a URL do gateway selecionado; senhas não são persistidas. O onboarding geralmente gera um token de gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à UI de Controle de um novo navegador ou dispositivo, o Gateway geralmente exige uma **aprovação de pareamento única**. Esta é uma medida de segurança para impedir acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se o navegador tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute `openclaw devices list` novamente antes da aprovação.

Se o navegador já estiver pareado e você alterá-lo de acesso de leitura para acesso de escrita/admin, isso será tratado como uma atualização de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

<Note>
- Conexões diretas de navegador por local loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode pular a rodada de pareamento para sessões de operador da UI de Controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Vínculos diretos da Tailnet, conexões de navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo exclusivo, então trocar de navegador ou limpar os dados do navegador exigirá novo pareamento.

</Note>

## Identidade pessoal (local do navegador)

A UI de Controle oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada às mensagens enviadas para atribuição em sessões compartilhadas. Ela fica no armazenamento do navegador, é limitada ao perfil atual do navegador e não é sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais de autoria da transcrição nas mensagens que você efetivamente envia. Limpar os dados do site ou trocar de navegador a redefine para vazio.

O mesmo padrão local do navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca fazem round trip por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` ainda está disponível para clientes que não são UI gravarem o campo diretamente (como gateways roteirizados ou dashboards personalizados).

## Endpoint de configuração de runtime

A UI de Controle busca suas configurações de runtime em `/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não conseguem buscá-lo, e uma busca bem-sucedida exige um token/senha de gateway já válido, identidade do Tailscale Serve ou identidade de proxy confiável.

## Suporte a idiomas

A UI de Controle pode se localizar no primeiro carregamento com base no locale do seu navegador. Para substituir isso depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de locale fica no cartão Acesso ao Gateway, não em Aparência.

- Locales compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Traduções para idiomas diferentes de inglês são carregadas de forma preguiçosa no navegador.
- O locale selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes usam inglês como fallback.

As traduções da documentação são geradas para o mesmo conjunto de locales diferentes de inglês, mas o seletor de idioma integrado do site de documentação no Mintlify é limitado aos códigos de locale aceitos pelo Mintlify. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência mantém os temas integrados Claw, Knot e Dash, além de um slot de importação tweakcn local do navegador. Para importar um tema, abra o [editor tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Compartilhar** e cole o link de tema copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs do editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs de tema brutos e nomes de tema padrão como `amethyst-haze`.

Temas importados são armazenados apenas no perfil atual do navegador. Eles não são gravados na configuração do gateway e não são sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo muda o tema ativo de volta para Claw se o tema importado estava selecionado.

## O que ela pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Converse com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Atualizações do histórico de chat solicitam uma janela recente limitada com limites de texto por mensagem para que sessões grandes não obriguem o navegador a renderizar uma carga completa de transcrição antes que o chat fique utilizável.
    - Fale por meio de sessões em tempo real no navegador. A OpenAI usa WebRTC direto, o Google Live usa um token de navegador restrito e de uso único sobre WebSocket, e Plugins de voz em tempo real somente de backend usam o transporte de relay do Gateway. Sessões de provedor pertencentes ao cliente começam com `talk.client.create`; sessões de relay do Gateway começam com `talk.session.create`. O relay mantém as credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por `talk.session.appendAudio` e encaminha chamadas de ferramenta de provedor `openclaw_agent_consult` por `talk.client.toolCall` para a política do Gateway e para o modelo OpenClaw configurado maior.
    - Transmita chamadas de ferramenta + cartões de saída de ferramenta ao vivo no Chat (eventos do agente).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Canais: integrados mais status de canais de Plugins empacotados/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Atualizações de sondagem de canal mantêm o snapshot anterior visível enquanto verificações lentas de provedor terminam, e snapshots parciais são rotulados quando uma sondagem ou auditoria excede seu orçamento de UI.
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: liste por padrão as sessões de agentes configurados, faça fallback de chaves antigas de sessão de agente não configurado e aplique substituições de modelo/thinking/fast/verbose/trace/reasoning por sessão (`sessions.list`, `sessions.patch`).
    - Dreams: status de dreaming, alternância para ativar/desativar e leitor do Diário de Sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Jobs Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execuções (`cron.*`).
    - Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`).
    - Nós: lista + capacidades (`node.list`).
    - Aprovações de exec: edite allowlists de gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Visualize/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplique + reinicie com validação (`config.apply`) e acorde a última sessão ativa.
    - Gravações incluem uma proteção de hash-base para impedir sobrescrever edições concorrentes.
    - Gravações (`config.set`/`config.apply`/`config.patch`) fazem preflight da resolução de SecretRef ativo para refs na carga de configuração enviada; refs enviados ativos não resolvidos são rejeitados antes da gravação.
    - Renderização de schema + formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos de filhos imediatos, metadados de documentação em nós aninhados de objeto/wildcard/array/composição, além de schemas de Plugin + canal quando disponíveis); o editor JSON bruto está disponível apenas quando o snapshot tem um round trip bruto seguro.
    - Se um snapshot não puder fazer round trip seguro de texto bruto, a UI de Controle força o modo Formulário e desativa o modo Bruto para esse snapshot.
    - O editor JSON bruto "Redefinir para salvo" preserva o formato criado no bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer round trip com segurança.
    - Valores de objeto SecretRef estruturados são renderizados como somente leitura em entradas de texto de formulário para impedir corrupção acidental de objeto para string.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui tempos de atualização/RPC da UI de Controle, tempos lentos de renderização de chat/config e entradas de responsividade do navegador para quadros de animação longos ou tarefas longas quando o navegador expõe esses tipos de entrada PerformanceObserver.
    - Logs: tail ao vivo de logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git + reinício (`update.run`) com um relatório de reinício, depois faça polling de `update.status` após reconectar para verificar a versão do gateway em execução.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Para jobs isolados, a entrega usa por padrão anunciar resumo. Você pode alternar para nenhum se quiser execuções apenas internas.
    - Os campos de canal/destino aparecem quando anunciar é selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de webhook HTTP(S) válida.
    - Para jobs de sessão principal, os modos de entrega webhook e nenhum estão disponíveis.
    - Controles avançados de edição incluem excluir após execução, limpar substituição de agente, opções cron exatas/escalonadas, substituições de modelo/thinking do agente e alternâncias de entrega em melhor esforço.
    - A validação do formulário é inline com erros em nível de campo; valores inválidos desativam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
    - Fallback obsoleto: jobs legados armazenados com `notify: true` ainda podem usar `cron.webhook` até serem migrados.

  </Accordion>
</AccordionGroup>

## Comportamento do chat

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
    - Uploads de chat aceitam imagens e arquivos que não sejam vídeo. Imagens mantêm o caminho de imagem nativo; outros arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexo.
    - Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução, e `{ status: "ok" }` após a conclusão.
    - As respostas de `chat.history` têm limite de tamanho para segurança da UI. Quando entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Imagens do assistente/geradas são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, para que recarregamentos não dependam de payloads brutos de imagem em base64 permanecerem na resposta do histórico do chat.
    - Ao renderizar `chat.history`, a Control UI remove tags de diretivas inline apenas de exibição do texto visível do assistente (por exemplo, `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), e tokens de controle de modelo vazados em ASCII/largura completa, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply` ou o token de confirmação de Heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém mensagens locais otimistas do usuário/assistente visíveis se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais assim que o histórico do Gateway alcança o estado atual.
    - Eventos `chat` ao vivo são estado de entrega, enquanto `chat.history` é reconstruído a partir da transcrição durável da sessão. Após eventos finais de ferramentas, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição é documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` acrescenta uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas de UI (sem execução de agente, sem entrega de canal).
    - O cabeçalho do chat mostra o filtro de agente antes do seletor de sessão, e o seletor de sessão é escopado pelo agente selecionado. Trocar de agente mostra apenas sessões vinculadas a esse agente e recorre à sessão principal desse agente quando ele ainda não tem sessões de painel salvas.
    - Em larguras de desktop, os controles do chat ficam em uma única linha compacta e recolhem ao rolar para baixo na transcrição; rolar para cima, voltar ao topo ou chegar ao fim restaura os controles.
    - Mensagens consecutivas duplicadas somente de texto são renderizadas como um único balão com um selo de contagem. Mensagens que carregam imagens, anexos, saída de ferramenta ou pré-visualizações de canvas não são recolhidas.
    - Os seletores de modelo e pensamento no cabeçalho do chat aplicam patch à sessão ativa imediatamente por meio de `sessions.patch`; eles são substituições persistentes da sessão, não opções de envio válidas apenas por um turno.
    - Se você enviar uma mensagem enquanto uma alteração do seletor de modelo para a mesma sessão ainda estiver sendo salva, o compositor aguardará esse patch de sessão antes de chamar `chat.send`, para que o envio use o modelo selecionado.
    - Digitar `/new` na Control UI cria e alterna para a mesma sessão nova de painel que Novo Chat, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, ele redefine a sessão principal no lugar. Digitar `/reset` mantém a redefinição explícita no lugar do Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada do Gateway. Se `agents.defaults.models` estiver presente, essa lista de permissão orienta o seletor, incluindo entradas `provider/*` que mantêm catálogos escopados por provedor dinâmicos. Caso contrário, o seletor mostra entradas explícitas de `models.providers.*.models` mais provedores com autenticação utilizável. O catálogo completo permanece disponível por meio do RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios recentes de uso de sessão do Gateway incluem tokens de contexto atuais, a área do compositor do chat mostra um indicador compacto de uso de contexto. Ele muda para estilo de aviso sob alta pressão de contexto e, nos níveis recomendados de Compaction, mostra um botão compacto que executa o caminho normal de Compaction da sessão. Snapshots de tokens desatualizados ficam ocultos até que o Gateway reporte uso recente novamente.

  </Accordion>
  <Accordion title="Modo Talk (tempo real no navegador)">
    O modo Talk usa um provedor de voz em tempo real registrado. Configure OpenAI com `talk.realtime.provider: "openai"` mais `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` ou um perfil OAuth `openai-codex`; configure Google com `talk.realtime.provider: "google"` mais `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API padrão do provedor. OpenAI recebe um segredo efêmero de cliente Realtime para WebRTC. Google Live recebe um token de autenticação de API Live restrito e de uso único para uma sessão WebSocket no navegador, com instruções e declarações de ferramentas travadas no token pelo Gateway. Provedores que expõem apenas uma ponte realtime de backend passam pelo transporte de retransmissão do Gateway, para que credenciais e sockets de fornecedor permaneçam no servidor enquanto o áudio do navegador passa por RPCs autenticados do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instruções fornecidas pelo chamador.

    O compositor do Chat inclui um botão de opções de Talk ao lado do botão iniciar/parar Talk. As opções se aplicam à próxima sessão Talk e podem substituir provedor, transporte, modelo, voz, esforço de raciocínio, limiar de VAD, duração do silêncio e preenchimento de prefixo. Quando uma opção fica em branco, o Gateway usa padrões configurados quando disponíveis ou o padrão do provedor. Selecionar retransmissão do Gateway força o caminho de retransmissão do backend; selecionar WebRTC mantém a sessão pertencente ao cliente e falha em vez de recorrer silenciosamente à retransmissão se o provedor não puder criar uma sessão de navegador.

    No compositor do Chat, o controle de Talk é o botão de ondas ao lado do botão de ditado por microfone. Quando Talk inicia, a linha de status do compositor mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta realtime consulta o modelo maior configurado por meio de `talk.client.toolCall`.

    Smoke ao vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a ponte WebSocket de backend da OpenAI, a troca SDP WebRTC de navegador da OpenAI, a configuração WebSocket de navegador com token restrito do Google Live e o adaptador de navegador de retransmissão do Gateway com mídia de microfone falsa. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Parar** (chama `chat.abort`).
    - Enquanto uma execução estiver ativa, acompanhamentos normais entram na fila. Clique em **Conduzir** em uma mensagem na fila para injetar esse acompanhamento no turno em execução.
    - Digite `/stop` (ou frases autônomas de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial de aborto">
    - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI.
    - O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer.
    - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição possam distinguir parciais de aborto da saída de conclusão normal.

  </Accordion>
</AccordionGroup>

## Instalação de PWA e web push

A Control UI inclui um `manifest.webmanifest` e um service worker, para que navegadores modernos possam instalá-la como uma PWA independente. Web Push permite que o Gateway acorde a PWA instalada com notificações mesmo quando a aba ou janela do navegador não está aberta.

| Superfície                                            | O que faz                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto da PWA. Navegadores oferecem "Instalar app" quando ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (sob o diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar payloads de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura do navegador persistidos.                  |

Substitua o par de chaves VAPID por variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações multi-host, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `mailto:openclaw@localhost`)

A Control UI usa estes métodos do Gateway protegidos por escopo para registrar e testar assinaturas de navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
Web Push é independente do caminho de retransmissão APNS do iOS (veja [Configuração](/pt-BR/gateway/configuration) para push com suporte de retransmissão) e do método `push.test` existente, que miram o pareamento móvel nativo.
</Note>

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desativa a execução de scripts dentro de embeds hospedados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interativos enquanto mantém isolamento de origem; este é o padrão e normalmente é suficiente para jogos/widgets de navegador autocontidos.
  </Tab>
  <Tab title="trusted">
    Adiciona `allow-same-origin` sobre `allow-scripts` para documentos do mesmo site que intencionalmente precisam de privilégios mais fortes.
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
Use `trusted` apenas quando o documento embutido realmente precisar de comportamento de mesma origem. Para a maioria dos jogos e canvases interativos gerados por agentes, `scripts` é a escolha mais segura.
</Warning>

URLs absolutas externas de embed `http(s)` permanecem bloqueadas por padrão. Se você intencionalmente quiser que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura de mensagens do chat

Mensagens de chat agrupadas usam uma largura máxima legível por padrão. Implantações em monitores largos podem substituí-la sem aplicar patch ao CSS empacotado definindo `gateway.controlUi.chatMessageMaxWidth`:

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

## Acesso tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy dele com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, solicitações do Control UI/WebSocket Serve podem autenticar por meio de cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o ao cabeçalho, e só aceita esses cabeçalhos quando a solicitação chega pelo loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da Control UI com identidade de dispositivo do navegador, esse caminho Serve verificado também ignora a ida e volta de pareamento do dispositivo; navegadores sem dispositivo e conexões com função de nó ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para tráfego Serve. Em seguida, use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade do Serve, tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações de limite de taxa. Portanto, novas tentativas ruins simultâneas do mesmo navegador podem mostrar `retry later` na segunda solicitação em vez de duas incompatibilidades simples competindo em paralelo.

    <Warning>
    A autenticação Serve sem token pressupõe que o host do Gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular ao tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Em seguida, abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da UI (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador será executado em um **contexto não seguro** e bloqueará WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da Control UI sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade com HTTP inseguro somente em localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da Control UI do operador por meio de `gateway.auth.mode: "trusted-proxy"`
- quebra de emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do Gateway)

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

    - Permite que sessões da Control UI em localhost prossigam sem identidade de dispositivo em contextos HTTP não seguros.
    - Não ignora verificações de pareamento.
    - Não relaxa requisitos de identidade de dispositivo remotos (não localhost).

  </Accordion>
  <Accordion title="Somente quebra de emergência">
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
    `dangerouslyDisableDeviceAuth` desativa as verificações de identidade de dispositivo da Control UI e é um rebaixamento severo de segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Observação sobre proxy confiável">
    - Autenticação trusted-proxy bem-sucedida pode admitir sessões da Control UI de **operador** sem identidade de dispositivo.
    - Isso **não** se estende a sessões da Control UI com função de nó.
    - Proxies reversos de loopback no mesmo host ainda não satisfazem a autenticação trusted-proxy; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para obter orientação de configuração de HTTPS.

## Política de segurança de conteúdo

A Control UI é fornecida com uma política `img-src` rígida: somente ativos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagem remotas `http(s)` e relativas a protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) ainda são renderizados, incluindo rotas de avatar autenticadas que a UI busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` ainda são renderizadas (útil para payloads em protocolo).
- URLs `blob:` locais criadas pela Control UI ainda são renderizadas.
- URLs de avatar remotas emitidas por metadados de canal são removidas nos auxiliares de avatar da Control UI e substituídas pelo logotipo/distintivo integrado, portanto um canal comprometido ou malicioso não pode forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativo e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do Gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do Gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (correspondendo à rota irmã assistant-media). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estão protegidos.
- A própria Control UI encaminha o token do Gateway como um cabeçalho bearer ao buscar avatares, e usa URLs blob autenticadas para que a imagem ainda seja renderizada nos dashboards.

Se você desativar a autenticação do Gateway (não recomendado em hosts compartilhados), a rota de avatar também se tornará não autenticada, de acordo com o restante do Gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do Gateway está configurada, prévias de mídia local do assistente usam uma rota em duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da Control UI. O navegador envia o token do Gateway como um cabeçalho bearer ao verificar a disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração limitado a esse caminho de origem exato.
- URLs de imagem, áudio, vídeo e documento renderizadas pelo navegador usam `mediaTicket=<ticket>` em vez do token ou da senha ativa do Gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

Isso mantém a renderização normal de mídia compatível com elementos de mídia nativos do navegador sem colocar credenciais reutilizáveis do Gateway em URLs de mídia visíveis.

## Construindo a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Construa-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quer URLs de ativos fixas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Em seguida, aponte a UI para sua URL WS do Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Página em branco da Control UI

Se o navegador carregar um dashboard em branco e o DevTools não mostrar nenhum erro útil, uma extensão ou script de conteúdo inicial pode ter impedido a avaliação do aplicativo de módulo JavaScript. A página estática inclui um painel de recuperação em HTML simples que aparece quando `<openclaw-app>` não está registrado após a inicialização.

Use a ação **Tentar novamente** do painel após alterar o ambiente do navegador, ou recarregue manualmente após estas verificações:

- Desative extensões que injetam em todas as páginas, especialmente extensões com scripts de conteúdo `<all_urls>`.
- Tente uma janela privada, um perfil de navegador limpo ou outro navegador.
- Mantenha o Gateway em execução e verifique a mesma URL do dashboard após a alteração do navegador.

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Control UI é composta por arquivos estáticos; o destino WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite localmente, mas o Gateway roda em outro lugar.

<Steps>
  <Step title="Iniciar o servidor de desenvolvimento da UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Abrir com gatewayUrl">
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
  <Accordion title="Observações">
    - `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
    - Se você passar um endpoint `ws://` ou `wss://` completo via `gatewayUrl`, codifique o valor de `gatewayUrl` para URL para que o navegador analise a string de consulta corretamente.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de solicitação e Referer. Parâmetros de consulta `?token=` legados ainda são importados uma vez por compatibilidade, mas somente como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas na memória.
    - Quando `gatewayUrl` está definido, a UI não recorre a credenciais de configuração ou ambiente. Forneça `token` (ou `password`) explicitamente. Credenciais explícitas ausentes são um erro.
    - Use `wss://` quando o Gateway estiver por trás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
    - Implantações não loopback da Control UI devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Isso inclui configurações remotas de desenvolvimento.
    - A inicialização do Gateway pode semear origens locais, como `http://localhost:<port>` e `http://127.0.0.1:<port>`, a partir do bind e da porta efetivos de runtime, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto para testes locais estritamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder a qualquer host que eu esteja usando."
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

- [Dashboard](/pt-BR/web/dashboard) — dashboard do Gateway
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento de integridade do Gateway
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
