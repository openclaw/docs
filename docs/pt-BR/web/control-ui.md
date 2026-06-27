---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada em navegador para o Gateway (chat, atividade, nós, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-06-27T18:20:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

A Interface de Controle é um pequeno aplicativo de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o Gateway WebSocket** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de `trusted-proxy` quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da aba atual do navegador e a URL do gateway selecionada; senhas não são persistidas. O onboarding geralmente gera um token de gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Interface de Controle a partir de um novo navegador ou dispositivo, o Gateway geralmente exige uma **aprovação de pareamento única**. Esta é uma medida de segurança para impedir acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Listar solicitações pendentes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprovar por ID de solicitação">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se o navegador tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute novamente `openclaw devices list` antes da aprovação.

Se o navegador já estiver pareado e você o alterar de acesso de leitura para acesso de escrita/admin, isso será tratado como uma atualização de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla e solicita que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

Agentes Paperclip que se conectam por meio do adaptador `openclaw_gateway` usam o mesmo fluxo de aprovação da primeira execução. Após a tentativa inicial de conexão, execute `openclaw devices approve --latest` para visualizar a solicitação pendente e, em seguida, execute novamente o comando `openclaw devices approve <requestId>` impresso para aprová-la. Passe valores explícitos de `--url` e `--token` para um gateway remoto. Para manter as aprovações estáveis entre reinicializações, configure um `adapterConfig.devicePrivateKeyPem` persistente no Paperclip em vez de deixá-lo gerar uma nova identidade efêmera de dispositivo a cada execução.

<Note>
- Conexões diretas do navegador por local loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode ignorar a rodada de pareamento para sessões de operador da Interface de Controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Vínculos diretos da Tailnet, conexões de navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo único, portanto trocar de navegador ou limpar dados do navegador exigirá novo pareamento.

</Note>

## Identidade pessoal (local ao navegador)

A Interface de Controle oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada a mensagens de saída para atribuição em sessões compartilhadas. Ela fica no armazenamento do navegador, tem escopo no perfil de navegador atual e não é sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais de autoria da transcrição nas mensagens que você realmente envia. Limpar os dados do site ou trocar de navegador a redefine para vazio.

O mesmo padrão local ao navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca fazem ida e volta por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` ainda está disponível para clientes não UI que escrevem o campo diretamente (como gateways em scripts ou dashboards personalizados).

## Endpoint de configuração de runtime

A Interface de Controle busca suas configurações de runtime em `/control-ui-config.json`, resolvido em relação ao caminho base da Interface de Controle do gateway (por exemplo, `/__openclaw__/control-ui-config.json` quando a UI é servida em `/__openclaw__/`). Esse endpoint é protegido pela mesma autenticação de gateway que o restante da superfície HTTP: navegadores não autenticados não conseguem buscá-lo, e uma busca bem-sucedida exige um token/senha de gateway já válido, identidade do Tailscale Serve ou identidade de `trusted-proxy`.

## Suporte a idiomas

A Interface de Controle pode se localizar no primeiro carregamento com base na localidade do seu navegador. Para substituí-la depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de localidade fica no cartão Acesso ao Gateway, não em Aparência.

- Localidades com suporte: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Traduções que não são em inglês são carregadas sob demanda no navegador.
- A localidade selecionada é salva no armazenamento do navegador e reutilizada em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

As traduções da documentação são geradas para o mesmo conjunto de localidades que não são em inglês, mas o seletor de idiomas integrado do site de documentação no Mintlify é limitado aos códigos de localidade aceitos pelo Mintlify. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência mantém os temas integrados Claw, Knot e Dash, além de um slot de importação tweakcn local ao navegador. Para importar um tema, abra o [editor tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Compartilhar** e cole o link de tema copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs do editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs de tema brutos e nomes de temas padrão como `amethyst-haze`.

Aparência também inclui uma configuração de tamanho de texto local ao navegador. A configuração é armazenada com o restante das preferências da Interface de Controle, aplica-se ao texto do chat, ao texto do compositor, aos cartões de ferramentas e às barras laterais de chat, e mantém entradas de texto com pelo menos 16px para que o Safari móvel não aplique zoom automático ao focar.

Temas importados são armazenados apenas no perfil de navegador atual. Eles não são gravados na configuração do gateway e não são sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo troca o tema ativo de volta para Claw se o tema importado estava selecionado.

## O que ela pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Chat e Conversa">
    - Converse com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Atualizações do histórico de chat solicitam uma janela recente delimitada com limites de texto por mensagem, para que sessões grandes não obriguem o navegador a renderizar uma carga completa de transcrição antes que o chat fique utilizável.
    - Converse por meio de sessões em tempo real do navegador. OpenAI usa WebRTC direto, Google Live usa um token de navegador restrito de uso único via WebSocket, e plugins de voz em tempo real somente backend usam o transporte de relay do Gateway. Sessões de provedor de propriedade do cliente começam com `talk.client.create`; sessões de relay do Gateway começam com `talk.session.create`. O relay mantém credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por `talk.session.appendAudio`, encaminha chamadas de ferramenta do provedor `openclaw_agent_consult` por `talk.client.toolCall` para política do Gateway e o modelo OpenClaw configurado maior, e roteia direcionamento de voz de execução ativa por `talk.client.steer` ou `talk.session.steer`.
    - Transmita chamadas de ferramentas + cartões de saída de ferramentas ao vivo no Chat (eventos de agente).
    - Aba Atividade com resumos locais ao navegador, com redação em primeiro lugar, da atividade de ferramentas ao vivo a partir da entrega existente de eventos `session.tool` / ferramenta.

  </Accordion>
  <Accordion title="Canais, instâncias, sessões, sonhos">
    - Canais: status de canais integrados mais plugins de canais empacotados/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Atualizações de sondagem de canais mantêm o snapshot anterior visível enquanto verificações lentas de provedores terminam, e snapshots parciais são rotulados quando uma sondagem ou auditoria excede seu orçamento de UI.
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: lista sessões de agentes configurados por padrão, recorre a chaves obsoletas de sessões de agentes não configurados e aplica substituições por sessão de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sonhos: status de Dreaming, alternância ativar/desativar e leitor do Diário de Sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nós, aprovações de execução">
    - Tarefas Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`).
    - Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`).
    - Nós: lista + capacidades (`node.list`).
    - Aprovações de execução: editar listas de permissão do gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuração">
    - Visualizar/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tem uma página de configurações dedicada para servidores configurados, ativação, resumos de OAuth/filtro/paralelismo, comandos comuns de operador e o editor de configuração `mcp` com escopo.
    - Aplicar + reiniciar com validação (`config.apply`) e despertar a última sessão ativa.
    - Escritas incluem uma proteção de hash base para evitar sobrescrever edições concorrentes.
    - Escritas (`config.set`/`config.apply`/`config.patch`) fazem preflight da resolução de SecretRef ativa para refs na carga de configuração enviada; refs ativas enviadas e não resolvidas são rejeitadas antes da escrita.
    - Salvamentos de formulário descartam placeholders redigidos obsoletos que não podem ser restaurados a partir da configuração salva, preservando valores redigidos que ainda mapeiam para segredos salvos.
    - Renderização de esquema + formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos de filhos imediatos, metadados de documentação em nós aninhados de objeto/curinga/array/composição, além de esquemas de plugin + canal quando disponíveis); o editor JSON bruto fica disponível apenas quando o snapshot tem uma ida e volta bruta segura.
    - Se um snapshot não puder fazer ida e volta segura de texto bruto, a Interface de Controle força o modo Formulário e desativa o modo Bruto para esse snapshot.
    - O editor JSON bruto "Redefinir para salvo" preserva a forma criada em bruto (formatação, comentários, layout `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer ida e volta com segurança.
    - Valores estruturados de objetos SecretRef são renderizados como somente leitura em entradas de texto de formulário para impedir corrupção acidental de objeto para string.

  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui tempos de atualização/RPC da Interface de Controle, tempos lentos de renderização de chat/configuração e entradas de responsividade do navegador para quadros de animação longos ou tarefas longas quando o navegador expõe esses tipos de entrada PerformanceObserver.
    - Logs: acompanhamento ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: executar uma atualização de pacote/git + reinicialização (`update.run`) com um relatório de reinicialização e, em seguida, consultar `update.status` após a reconexão para verificar a versão do gateway em execução.

  </Accordion>
  <Accordion title="Notas do painel de tarefas Cron">
    - Para tarefas isoladas, a entrega usa por padrão o resumo de anúncio. Você pode mudar para nenhum se quiser execuções apenas internas.
    - Os campos de canal/destino aparecem quando anúncio está selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de webhook HTTP(S) válida.
    - Para tarefas de sessão principal, os modos de entrega webhook e nenhum estão disponíveis.
    - Os controles de edição avançada incluem excluir após execução, limpar substituição de agente, opções cron exatas/escalonadas, substituições de modelo/raciocínio do agente e alternâncias de entrega por melhor esforço.
    - A validação do formulário é em linha com erros no nível do campo; valores inválidos desativam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
    - Fallback obsoleto: execute `openclaw doctor --fix` para migrar tarefas legadas armazenadas com `notify: true` de `cron.webhook` para webhook explícito por tarefa ou entrega de conclusão.

  </Accordion>
</AccordionGroup>

## Página MCP

A página MCP dedicada é uma visualização de operador para servidores MCP gerenciados pelo OpenClaw em `mcp.servers`. Ela não inicia transportes MCP por conta própria; use-a para inspecionar e editar a configuração salva e, em seguida, use `openclaw mcp doctor --probe` quando precisar de prova de servidor ao vivo.

Fluxo de trabalho típico:

1. Abra **MCP** na barra lateral.
2. Verifique os cartões de resumo para contagens de servidores totais, habilitados, OAuth e filtrados.
3. Revise cada linha de servidor quanto a transporte, habilitação, autenticação, filtros, timeouts e dicas de comando.
4. Alterne a habilitação quando um servidor deve permanecer configurado, mas ficar fora da descoberta em runtime.
5. Edite a seção de configuração `mcp` com escopo para definições de servidor, cabeçalhos, caminhos TLS/mTLS, metadados OAuth, filtros de ferramentas e metadados de projeção do Codex.
6. Use **Salvar** para gravar a configuração, ou **Salvar e Publicar** quando o Gateway em execução deve aplicar a configuração alterada.
7. Execute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` em um terminal quando o processo editado precisar de diagnósticos estáticos, prova ao vivo ou descarte de runtime em cache.

A página oculta valores semelhantes a URL que carregam credenciais antes da renderização e coloca nomes de servidores entre aspas nos snippets de comando para que comandos copiados ainda funcionem com espaços ou metacaracteres de shell. A referência completa de CLI e configuração fica em [MCP](/pt-BR/cli/mcp).

## Aba Atividade

A aba Atividade é um observador efêmero local do navegador para atividade de ferramentas ao vivo. Ela é derivada do mesmo fluxo de eventos `session.tool` / ferramenta do Gateway que alimenta os cartões de ferramentas do Chat; ela não adiciona outra família de eventos do Gateway, endpoint, armazenamento durável de atividade, feed de métricas ou fluxo de observador externo.

As entradas de Atividade mantêm apenas resumos sanitizados e prévias de saída ocultadas e truncadas. Valores de argumentos de ferramentas não são armazenados no estado de Atividade; a UI mostra que os argumentos estão ocultos e registra apenas a contagem de campos de argumento. A lista em memória acompanha a aba atual do navegador, sobrevive à navegação dentro da Control UI e é redefinida ao recarregar a página, trocar de sessão ou usar **Limpar**.

## Comportamento do chat

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`. Clientes confiáveis da Control UI também podem receber metadados opcionais de temporização de ACK para diagnósticos locais.
    - Uploads no chat aceitam imagens e arquivos que não sejam vídeo. Imagens mantêm o caminho nativo da imagem; outros arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexo.
    - Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` durante a execução e `{ status: "ok" }` após a conclusão.
    - Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando entradas de transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Quando uma mensagem visível do assistente foi truncada em `chat.history`, o leitor lateral pode buscar sob demanda a entrada completa da transcrição normalizada para exibição por meio de `chat.message.get` usando `sessionKey`, `agentId` ativo quando necessário, e `messageId` da transcrição. Se o Gateway ainda não conseguir retornar mais, o leitor mostra um estado explícito de indisponível em vez de repetir silenciosamente a prévia truncada.
    - Imagens do assistente/geradas são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, então recarregamentos não dependem de payloads brutos de imagem em base64 permanecerem na resposta do histórico do chat.
    - Ao renderizar `chat.history`, a Control UI remove do texto visível do assistente tags de diretiva em linha apenas para exibição (por exemplo, `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamada de ferramenta em texto puro (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e tokens de controle de modelo ASCII/largura total vazados, e omite entradas do assistente cujo texto visível inteiro é apenas o token silencioso exato `NO_REPLY` / `no_reply` ou o token de confirmação de Heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização de chat mantém mensagens locais otimistas de usuário/assistente visíveis se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais quando o histórico do Gateway se atualiza.
    - Eventos `chat` ao vivo são estado de entrega, enquanto `chat.history` é reconstruído a partir da transcrição durável da sessão. Após eventos finais de ferramenta, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição está documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` anexa uma nota de assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas de UI (sem execução de agente, sem entrega de canal).
    - O cabeçalho do chat mostra o filtro de agente antes do seletor de sessão, e o seletor de sessão é delimitado pelo agente selecionado. Trocar de agente mostra apenas sessões vinculadas a esse agente e volta para a sessão principal desse agente quando ele ainda não tem sessões de painel salvas.
    - Em larguras de desktop, os controles do chat permanecem em uma linha compacta e recolhem ao rolar a transcrição para baixo; rolar para cima, voltar ao topo ou chegar ao fim restaura os controles.
    - Mensagens consecutivas duplicadas somente de texto são renderizadas como um balão com um selo de contagem. Mensagens que carregam imagens, anexos, saída de ferramenta ou prévias de canvas não são recolhidas.
    - Os seletores de modelo e raciocínio do cabeçalho do chat aplicam patch à sessão ativa imediatamente por meio de `sessions.patch`; eles são substituições persistentes da sessão, não opções de envio apenas para uma vez.
    - Se você enviar uma mensagem enquanto uma alteração do seletor de modelo para a mesma sessão ainda está sendo salva, o compositor aguarda esse patch da sessão antes de chamar `chat.send` para que o envio use o modelo selecionado.
    - Digitar `/new` na Control UI cria e alterna para a mesma nova sessão de painel que Novo Chat, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, redefine a sessão principal no local. Digitar `/reset` mantém a redefinição explícita no local do Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada do Gateway. Se `agents.defaults.models` estiver presente, essa allowlist orienta o seletor, incluindo entradas `provider/*` que mantêm catálogos com escopo de provedor dinâmicos. Caso contrário, o seletor mostra entradas explícitas `models.providers.*.models` e provedores com autenticação utilizável. O catálogo completo permanece disponível pelo RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios novos de uso de sessão do Gateway incluem tokens de contexto atuais, a área do compositor do chat mostra um indicador compacto de uso de contexto. Ele muda para estilo de aviso sob alta pressão de contexto e, em níveis recomendados de Compaction, mostra um botão compacto que executa o caminho normal de Compaction da sessão. Snapshots obsoletos de tokens ficam ocultos até que o Gateway relate uso novo novamente.

  </Accordion>
  <Accordion title="Modo de conversa (tempo real no navegador)">
    O modo de conversa usa um provedor de voz em tempo real registrado. Configure OpenAI com `talk.realtime.provider: "openai"` mais um perfil de autenticação de chave de API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY`; perfis OAuth da OpenAI não configuram voz Realtime. Configure Google com `talk.realtime.provider: "google"` mais `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API padrão de provedor. A OpenAI recebe um segredo efêmero de cliente Realtime para WebRTC. O Google Live recebe um token de autenticação Live API restrito e de uso único para uma sessão WebSocket do navegador, com instruções e declarações de ferramentas travadas no token pelo Gateway. Provedores que expõem apenas uma ponte de tempo real no backend passam pelo transporte de retransmissão do Gateway, então credenciais e sockets do fornecedor ficam no lado do servidor enquanto o áudio do navegador passa por RPCs autenticados do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instruções fornecidas pelo chamador.

    O compositor do Chat inclui um botão de opções de conversa ao lado do botão de iniciar/parar conversa. As opções se aplicam à próxima sessão de conversa e podem substituir provedor, transporte, modelo, voz, esforço de raciocínio, limiar de VAD, duração do silêncio e preenchimento de prefixo. Quando uma opção fica em branco, o Gateway usa padrões configurados quando disponíveis ou o padrão do provedor. Selecionar retransmissão do Gateway força o caminho de retransmissão do backend; selecionar WebRTC mantém a sessão pertencente ao cliente e falha em vez de recorrer silenciosamente à retransmissão se o provedor não conseguir criar uma sessão de navegador.

    No compositor do Chat, o controle de conversa é o botão de ondas ao lado do botão de ditado por microfone. Quando a conversa começa, a linha de status do compositor mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por meio de `talk.client.toolCall`.

    Smoke ao vivo de mantenedor: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a ponte WebSocket de backend da OpenAI, a troca SDP WebRTC de navegador da OpenAI, a configuração de WebSocket de navegador com token restrito do Google Live e o adaptador de navegador de retransmissão do Gateway com mídia de microfone falsa. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Parar** (chama `chat.abort`).
    - Enquanto uma execução está ativa, acompanhamentos normais entram em fila. Clique em **Conduzir** em uma mensagem enfileirada para injetar esse acompanhamento no turno em execução.
    - Digite `/stop` (ou frases autônomas de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` oferece suporte a `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial de aborto">
    - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI.
    - O Gateway persiste texto parcial de assistente abortado no histórico da transcrição quando há saída em buffer.
    - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição consigam diferenciar partes parciais abortadas de saída de conclusão normal.

  </Accordion>
</AccordionGroup>

## Instalação PWA e web push

A Control UI inclui um `manifest.webmanifest` e um service worker, então navegadores modernos podem instalá-la como uma PWA independente. Web Push permite que o Gateway desperte a PWA instalada com notificações mesmo quando a aba ou janela do navegador não está aberta.

Se a página mostrar **Incompatibilidade de protocolo** logo após uma atualização do OpenClaw, primeiro reabra o painel com `openclaw dashboard` e force a atualização da página. Se ainda falhar, limpe os dados do site para a origem do painel ou teste em uma janela privada do navegador; uma aba antiga ou cache de service worker do navegador pode continuar executando um pacote da Control UI anterior à atualização contra o Gateway mais novo.

| Superfície                                           | O que ela faz                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto PWA. Os navegadores oferecem "Instalar app" quando ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (no diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar payloads de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura do navegador persistidos.                  |

Substitua o par de chaves VAPID por meio de variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações multi-host, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `https://openclaw.ai`)

A Interface de Controle usa estes métodos do Gateway com escopo restrito para registrar e testar assinaturas do navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
Web Push é independente do caminho de relay APNS do iOS (consulte [Configuração](/pt-BR/gateway/configuration) para push com relay) e do método `push.test` existente, que tem como alvo o pareamento móvel nativo.
</Note>

## Incorporações hospedadas

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desativa a execução de scripts dentro de incorporações hospedadas.
  </Tab>
  <Tab title="scripts (default)">
    Permite incorporações interativas mantendo o isolamento de origem; este é o padrão e geralmente é suficiente para jogos/widgets de navegador autocontidos.
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
Use `trusted` somente quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos gerados por agentes e canvases interativos, `scripts` é a escolha mais segura.
</Warning>

URLs absolutas externas de incorporação `http(s)` permanecem bloqueadas por padrão. Se você quiser intencionalmente que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura das mensagens de chat

Mensagens de chat agrupadas usam uma largura máxima legível por padrão. Implantações em monitores largos podem substituí-la sem corrigir o CSS empacotado definindo `gateway.controlUi.chatMessageMaxWidth`:

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

## Acesso à tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferencial)">
    Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy dele com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, solicitações Serve da Interface de Controle/WebSocket podem autenticar via cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o ao cabeçalho, e só aceita isso quando a solicitação atinge o loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da Interface de Controle com identidade de dispositivo do navegador, esse caminho Serve verificado também pula a ida e volta de pareamento de dispositivo; navegadores sem dispositivo e conexões com função de node ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado até mesmo para tráfego Serve. Então use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade Serve, tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações de limite de taxa. Portanto, novas tentativas ruins simultâneas do mesmo navegador podem mostrar `retry later` na segunda solicitação em vez de duas incompatibilidades simples competindo em paralelo.

    <Warning>
    A autenticação Serve sem token presume que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular à tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Então abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da interface (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o painel por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador roda em um **contexto não seguro** e bloqueia WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da Interface de Controle sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade HTTP insegura somente para localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da Interface de Controle do operador por meio de `gateway.auth.mode: "trusted-proxy"`
- emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a interface localmente:

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

    - Ela permite que sessões da Interface de Controle em localhost prossigam sem identidade de dispositivo em contextos HTTP não seguros.
    - Ela não ignora verificações de pareamento.
    - Ela não afrouxa requisitos de identidade de dispositivo remotos (não localhost).

  </Accordion>
  <Accordion title="Somente emergência">
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
    `dangerouslyDisableDeviceAuth` desativa verificações de identidade de dispositivo da Interface de Controle e é uma redução severa de segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy confiável">
    - Autenticação trusted-proxy bem-sucedida pode admitir sessões da Interface de Controle de **operador** sem identidade de dispositivo.
    - Isso **não** se estende a sessões da Interface de Controle com função de node.
    - Proxies reversos de loopback no mesmo host ainda não satisfazem autenticação trusted-proxy; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientação de configuração HTTPS.

## Política de segurança de conteúdo

A Interface de Controle é fornecida com uma política `img-src` rígida: somente ativos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagem remotas `http(s)` e relativas a protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) ainda são renderizados, incluindo rotas de avatar autenticadas que a interface busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` ainda são renderizadas (úteis para payloads em protocolo).
- URLs `blob:` locais criadas pela Interface de Controle ainda são renderizadas.
- URLs remotas de avatar emitidas por metadados de canais são removidas nos helpers de avatar da Interface de Controle e substituídas pelo logotipo/selo integrado, portanto um canal comprometido ou malicioso não pode forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativo e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da Interface de Controle exige o mesmo token do gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (igual à rota irmã assistant-media). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estão protegidos.
- A própria Interface de Controle encaminha o token do gateway como um cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem ainda seja renderizada em painéis.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também passa a não exigir autenticação, em linha com o restante do gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do gateway está configurada, pré-visualizações de mídia local do assistente usam uma rota em duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da Interface de Controle. O navegador envia o token do gateway como um cabeçalho bearer ao verificar disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração com escopo para exatamente esse caminho de origem.
- URLs de imagem, áudio, vídeo e documento renderizadas pelo navegador usam `mediaTicket=<ticket>` em vez do token ou senha ativos do gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

Isso mantém a renderização normal de mídia compatível com elementos de mídia nativos do navegador sem colocar credenciais reutilizáveis do gateway em URLs de mídia visíveis.

## Criando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Crie-os com:

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

Então aponte a UI para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Página em branco da Interface de Controle

Se o navegador carregar um painel em branco e o DevTools não mostrar nenhum erro útil, uma extensão ou script de conteúdo antecipado pode ter impedido a avaliação do app de módulo JavaScript. A página estática inclui um painel de recuperação em HTML simples que aparece quando `<openclaw-app>` não está registrado após a inicialização.

Use a ação **Tentar novamente** do painel depois de alterar o ambiente do navegador, ou recarregue manualmente após estas verificações:

- Desative extensões que injetam em todas as páginas, especialmente extensões com scripts de conteúdo `<all_urls>`.
- Tente uma janela privada, um perfil de navegador limpo ou outro navegador.
- Mantenha o Gateway em execução e verifique a mesma URL do painel após a alteração do navegador.

## Depuração/teste: servidor de desenvolvimento + Gateway remoto

A Interface de Controle é composta por arquivos estáticos; o destino WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite localmente, mas o Gateway roda em outro lugar.

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

    Autenticação única opcional (se necessário):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações">
    - `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
    - Se você passar um endpoint `ws://` ou `wss://` completo via `gatewayUrl`, codifique o valor de `gatewayUrl` para URL para que o navegador analise a string de consulta corretamente.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de requisição e no Referer. Parâmetros de consulta legados `?token=` ainda são importados uma vez para compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas na memória.
    - Quando `gatewayUrl` está definido, a UI não recorre a credenciais de configuração ou ambiente. Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
    - Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
    - Implantações públicas da Control UI fora de loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Carregamentos privados de mesma origem em LAN/Tailnet a partir de loopback, RFC1918/link-local, `.local`, `.ts.net` ou hosts CGNAT do Tailscale são aceitos sem habilitar fallback de cabeçalho Host.
    - A inicialização do Gateway pode semear origens locais como `http://localhost:<port>` e `http://127.0.0.1:<port>` a partir do bind e da porta efetivos em tempo de execução, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto para testes locais estritamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder a qualquer host que eu estiver usando."
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

- [Dashboard](/pt-BR/web/dashboard) — dashboard do gateway
- [Health Checks](/pt-BR/gateway/health) — monitoramento de integridade do gateway
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
