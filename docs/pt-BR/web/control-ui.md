---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada em navegador para o Gateway (chat, atividade, nós, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-07-05T02:04:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a0be69835dd1f06484eaaa11935875156ebc2c489a99bea4049feabd17f0380
    source_path: web/control-ui.md
    workflow: 16
---

A Control UI é um pequeno app de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `openclaw gateway`.

<Note>
Em vinculações de LAN nativas do Windows, o Firewall do Windows ou uma Política de Grupo gerenciada pela organização ainda pode bloquear a URL de LAN anunciada mesmo quando `127.0.0.1` funciona no host do Gateway. Execute `openclaw gateway status --deep` no host Windows; ele relata portas provavelmente bloqueadas, incompatibilidades de perfil e regras de firewall locais que a política pode ignorar.
</Note>

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da aba atual do navegador e a URL do gateway selecionado; senhas não são persistidas. O onboarding geralmente gera um token do gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Control UI por um novo navegador ou dispositivo, o Gateway geralmente exige uma **aprovação de pareamento de uso único**. Esta é uma medida de segurança para impedir acesso não autorizado.

**O que você verá:** "disconnected (1008): pairing required"

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

Se o navegador já estiver pareado e você o alterar de acesso de leitura para acesso de escrita/admin, isso será tratado como um upgrade de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla e pede que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

Agentes Paperclip que se conectam por meio do adaptador `openclaw_gateway` usam o mesmo fluxo de aprovação da primeira execução. Após a tentativa inicial de conexão, execute `openclaw devices approve --latest` para pré-visualizar a solicitação pendente e depois execute novamente o comando `openclaw devices approve <requestId>` impresso para aprová-la. Passe valores explícitos de `--url` e `--token` para um gateway remoto. Para manter as aprovações estáveis entre reinicializações, configure um `adapterConfig.devicePrivateKeyPem` persistente no Paperclip em vez de permitir que ele gere uma nova identidade efêmera de dispositivo a cada execução.

<Note>
- Conexões diretas do navegador por local loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode ignorar a ida e volta do pareamento para sessões de operador da Control UI quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Vinculações diretas de Tailnet, conexões de navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo exclusivo, portanto trocar de navegador ou limpar os dados do navegador exigirá novo pareamento.

</Note>

## Parear um dispositivo móvel

Um administrador já pareado pode criar o QR de conexão para iOS/Android sem
abrir um terminal:

<Steps>
  <Step title="Abrir pareamento móvel">
    Selecione **Nós** e clique em **Parear dispositivo móvel** no cartão **Dispositivos**.
  </Step>
  <Step title="Conectar o telefone">
    No app móvel do OpenClaw, abra **Configurações** → **Gateway** e escaneie o QR
    code. Em vez disso, você pode copiar e colar o código de configuração.
  </Step>
  <Step title="Confirmar a conexão">
    O app oficial para iOS/Android se conecta automaticamente. Se **Dispositivos** mostrar uma
    solicitação pendente, revise sua função e escopos antes de aprová-la.
  </Step>
</Steps>

Criar um código de configuração exige `operator.admin`; o botão fica desabilitado para
sessões sem essa permissão. Um código de configuração contém uma credencial de bootstrap de curta duração,
então trate o QR e o código copiado como uma senha enquanto forem válidos. Para pareamento remoto,
o Gateway deve resolver para `wss://` (por exemplo, por meio do Tailscale
Serve/Funnel); `ws://` sem criptografia é limitado a endereços de loopback e LAN privada.
Consulte [Pareamento](/pt-BR/channels/pairing#pair-from-the-control-ui-recommended) para ver todos os
detalhes de segurança e fallback.

## Identidade pessoal (local do navegador)

A Control UI oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada a mensagens enviadas para atribuição em sessões compartilhadas. Ela vive no armazenamento do navegador, tem escopo limitado ao perfil atual do navegador e não é sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais de autoria de transcrições nas mensagens que você realmente envia. Limpar os dados do site ou trocar de navegador a redefine para vazio.

O mesmo padrão local do navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca fazem ida e volta por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` ainda está disponível para clientes que não são UI e gravam o campo diretamente (como gateways com scripts ou dashboards personalizados).

## Endpoint de configuração de runtime

A Control UI busca suas configurações de runtime em `/control-ui-config.json`, resolvido em relação ao caminho base da Control UI do gateway (por exemplo, `/__openclaw__/control-ui-config.json` quando a UI é servida sob `/__openclaw__/`). Esse endpoint é protegido pela mesma autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não conseguem buscá-lo, e uma busca bem-sucedida exige um token/senha de gateway já válido, identidade do Tailscale Serve ou uma identidade de proxy confiável.

## Suporte a idiomas

A Control UI pode se localizar no primeiro carregamento com base no locale do seu navegador. Para substituí-lo depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de locale fica no cartão Acesso ao Gateway, não em Aparência.

- Locales compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Traduções que não são em inglês são carregadas sob demanda no navegador.
- O locale selecionado é salvo no armazenamento do navegador e reutilizado em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

As traduções da documentação são geradas para o mesmo conjunto de locales que não são em inglês, mas o seletor de idiomas integrado do site de docs do Mintlify é limitado aos códigos de locale aceitos pelo Mintlify. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; elas podem não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência mantém os temas integrados Claw, Knot e Dash, além de um slot de importação tweakcn local do navegador. Para importar um tema, abra o [editor tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Compartilhar** e cole o link do tema copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs de editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs brutos de tema e nomes de tema padrão como `amethyst-haze`.

Aparência também inclui uma configuração de Tamanho do texto local do navegador. A configuração é armazenada com o restante das preferências da Control UI, aplica-se ao texto do chat, ao texto do compositor, aos cartões de ferramentas e às barras laterais de chat, e mantém entradas de texto com pelo menos 16px para que o Safari móvel não aplique zoom automático ao receber foco.

Temas importados são armazenados apenas no perfil atual do navegador. Eles não são gravados na configuração do gateway e não são sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo muda o tema ativo de volta para Claw se o tema importado estava selecionado.

## O que ela pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Chat e conversa">
    - Converse com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Atualizações do histórico de chat solicitam uma janela recente limitada com tetos de texto por mensagem para que sessões grandes não obriguem o navegador a renderizar uma carga completa de transcrição antes de o chat ficar utilizável.
    - Converse por meio de sessões em tempo real do navegador. A OpenAI usa WebRTC direto, o Google Live usa um token restrito de uso único do navegador via WebSocket, e plugins de voz em tempo real somente de backend usam o transporte de retransmissão do Gateway. Sessões de provedor de propriedade do cliente começam com `talk.client.create`; sessões de retransmissão do Gateway começam com `talk.session.create`. A retransmissão mantém as credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por meio de `talk.session.appendAudio`, encaminha chamadas de ferramentas do provedor `openclaw_agent_consult` por meio de `talk.client.toolCall` para a política do Gateway e o modelo OpenClaw configurado maior, e roteia o direcionamento por voz da execução ativa por meio de `talk.client.steer` ou `talk.session.steer`.
    - Transmita chamadas de ferramentas + cartões de saída de ferramentas ao vivo no Chat (eventos de agente).
    - Aba Atividade com resumos locais do navegador e com redação em primeiro lugar da atividade de ferramentas ao vivo a partir da entrega existente de `session.tool` / eventos de ferramentas.

  </Accordion>
  <Accordion title="Canais, instâncias, sessões, sonhos">
    - Canais: status de canais integrados e de plugins empacotados/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Atualizações de sondagem de canal mantêm o snapshot anterior visível enquanto verificações lentas de provedor terminam, e snapshots parciais são rotulados quando uma sondagem ou auditoria excede seu orçamento de UI.
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: liste por padrão sessões de agentes configurados, fixe sessões frequentes, renomeie-as, arquive ou restaure sessões inativas, use fallback a partir de chaves obsoletas de sessões de agentes não configurados e aplique substituições por sessão de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`). Sessões fixadas são ordenadas acima de sessões recentes não fixadas; sessões arquivadas ficam na visualização arquivada da página Sessões e mantêm suas transcrições.
    - Sonhos: status de dreaming, alternância de habilitar/desabilitar e leitor do Diário de Sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nós, aprovações de exec">
    - Tarefas Cron: listar/adicionar/editar/executar/habilitar/desabilitar + histórico de execução (`cron.*`).
    - Skills: status, habilitar/desabilitar, instalar, atualizações de chave de API (`skills.*`).
    - Nós: lista + capacidades (`node.list`), criar códigos de configuração móvel e aprovar pareamento de dispositivo (`device.pair.*`).
    - Aprovações de exec: edite allowlists de gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Visualize/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - O MCP tem uma página dedicada de configurações para servidores configurados, habilitação, resumos de OAuth/filtro/paralelos, comandos comuns do operador e o editor de configuração `mcp` com escopo.
    - Aplique + reinicie com validação (`config.apply`) e desperte a última sessão ativa.
    - As gravações incluem uma proteção por hash-base para evitar sobrescrever edições simultâneas.
    - As gravações (`config.set`/`config.apply`/`config.patch`) fazem uma pré-verificação da resolução de SecretRef ativa para refs no payload de configuração enviado; refs enviadas ativas não resolvidas são rejeitadas antes da gravação.
    - Salvamentos de formulário descartam placeholders redigidos obsoletos que não podem ser restaurados da configuração salva, preservando valores redigidos que ainda mapeiam para segredos salvos.
    - Renderização de esquema + formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos de filhos imediatos, metadados de documentação em nós aninhados de objeto/coringa/array/composição, além de esquemas de plugin + canal quando disponíveis); o editor de JSON bruto fica disponível somente quando o snapshot tem uma ida e volta bruta segura.
    - Se um snapshot não puder fazer ida e volta segura de texto bruto, a Control UI força o modo Formulário e desabilita o modo Bruto para esse snapshot.
    - O editor de JSON bruto "Redefinir para salvo" preserva a forma escrita no bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, de modo que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer ida e volta com segurança.
    - Valores de objeto SecretRef estruturados são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Depuração: snapshots de status/integridade/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui temporizações de atualização/RPC da Control UI, temporizações lentas de renderização de chat/configuração e entradas de responsividade do navegador para quadros de animação longos ou tarefas longas quando o navegador expõe esses tipos de entrada de PerformanceObserver.
    - Logs: acompanhamento ao vivo de logs de arquivo do Gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git + reinicialização (`update.run`) com um relatório de reinicialização e, depois, consulte `update.status` após reconectar para verificar a versão do Gateway em execução.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Para jobs isolados, a entrega usa resumo de anúncio por padrão. Você pode alternar para none se quiser execuções apenas internas.
    - Campos de canal/destino aparecem quando anúncio está selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de Webhook HTTP(S) válida.
    - Para jobs de sessão principal, os modos de entrega Webhook e none estão disponíveis.
    - Controles de edição avançada incluem excluir após execução, limpar substituição de agente, opções exatas/escalonadas de Cron, substituições de modelo/raciocínio do agente e alternâncias de entrega de melhor esforço.
    - A validação do formulário é inline com erros em nível de campo; valores inválidos desabilitam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o Webhook é enviado sem cabeçalho de autenticação.
    - Fallback obsoleto: execute `openclaw doctor --fix` para migrar jobs legados armazenados com `notify: true` de `cron.webhook` para Webhook explícito por job ou entrega de conclusão.

  </Accordion>
</AccordionGroup>

## Página MCP

A página dedicada de MCP é uma visão de operador para servidores MCP gerenciados pelo OpenClaw em `mcp.servers`. Ela não inicia transportes MCP por conta própria; use-a para inspecionar e editar a configuração salva e, depois, use `openclaw mcp doctor --probe` quando precisar de comprovação de servidor ao vivo.

Fluxo de trabalho típico:

1. Abra **MCP** na barra lateral.
2. Verifique os cartões de resumo para contagens totais, habilitados, OAuth e de servidores filtrados.
3. Revise cada linha de servidor quanto a transporte, habilitação, autenticação, filtros, timeouts e dicas de comando.
4. Alterne a habilitação quando um servidor deve permanecer configurado, mas ficar fora da descoberta em tempo de execução.
5. Edite a seção de configuração `mcp` com escopo para definições de servidor, cabeçalhos, caminhos TLS/mTLS, metadados OAuth, filtros de ferramentas e metadados de projeção do Codex.
6. Use **Salvar** para uma gravação de configuração, ou **Salvar e Publicar** quando o Gateway em execução deve aplicar a configuração alterada.
7. Execute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` em um terminal quando o processo editado precisar de diagnósticos estáticos, comprovação ao vivo ou descarte de runtime em cache.

A página redige valores semelhantes a URL que contenham credenciais antes de renderizar e coloca nomes de servidor entre aspas em snippets de comando para que comandos copiados ainda funcionem com espaços ou metacaracteres de shell. A referência completa da CLI e de configuração fica em [MCP](/pt-BR/cli/mcp).

## Aba Atividade

A aba Atividade é um observador efêmero local do navegador para atividade de ferramentas ao vivo. Ela deriva do mesmo fluxo de eventos `session.tool` / ferramenta do Gateway que alimenta os cartões de ferramentas do Chat; ela não adiciona outra família de eventos do Gateway, endpoint, armazenamento durável de atividades, feed de métricas ou fluxo de observador externo.

Entradas de atividade mantêm apenas resumos sanitizados e prévias de saída redigidas e truncadas. Valores de argumentos de ferramentas não são armazenados no estado de Atividade; a UI mostra que os argumentos estão ocultos e registra apenas a contagem de campos de argumento. A lista em memória segue a aba atual do navegador, sobrevive à navegação dentro da Control UI e é redefinida ao recarregar a página, trocar de sessão ou usar **Limpar**.

## Terminal do operador

O terminal de operador acoplável é desabilitado por padrão. Para habilitá-lo, defina `gateway.terminal.enabled: true` e reinicie o Gateway. O terminal exige uma conexão `operator.admin` e abre um PTY do host no workspace do agente ativo. Novas abas seguem o agente de chat selecionado no momento.

<Warning>
O terminal é um shell de host sem confinamento e herda o ambiente do processo do Gateway. Habilite-o somente para implantações de operador confiáveis. O OpenClaw recusa sessões de terminal para agentes com `sandbox.mode: "all"`; alterar um agente ativo para esse modo fecha suas sessões de terminal existentes e em andamento.
</Warning>

Use **Ctrl + crase** para alternar o dock. O layout oferece suporte a acoplamento inferior e à direita, redimensiona com o viewport do navegador e mantém várias abas de shell. Consulte [configuração do Gateway](/pt-BR/gateway/configuration-reference#gateway) para `gateway.terminal.enabled` e a substituição opcional `gateway.terminal.shell`.

As sessões sobrevivem a desconexões: uma recarga de página, suspensão do laptop ou instabilidade de rede desanexa a sessão no Gateway em vez de encerrá-la, e a mesma aba do navegador se reconecta ao reconectar com a saída recente reproduzida. Sessões desanexadas são encerradas após `gateway.terminal.detachedSessionTimeoutSeconds` (padrão de 300 segundos; `0` restaura encerramento ao desconectar). `terminal.list` mostra sessões anexáveis, `terminal.attach` adota uma delas (tomada de controle estilo tmux), e `terminal.text` lê a saída recente de uma sessão como texto simples sem anexar — uma conveniência para agente/ferramental.

## Comportamento do chat

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`. Clientes confiáveis da Control UI também podem receber metadados opcionais de tempo de ACK para diagnósticos locais.
    - Uploads no chat aceitam imagens e arquivos que não sejam vídeos. Imagens mantêm o caminho nativo da imagem; outros arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexo.
    - Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` durante a execução e `{ status: "ok" }` após a conclusão.
    - Respostas de `chat.history` têm tamanho limitado para segurança da UI. Quando entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Quando uma mensagem visível do assistente foi truncada em `chat.history`, o leitor lateral pode buscar sob demanda a entrada completa da transcrição normalizada para exibição por meio de `chat.message.get` usando `sessionKey`, `agentId` ativo quando necessário, e `messageId` da transcrição. Se o Gateway ainda não conseguir retornar mais conteúdo, o leitor mostra um estado explicitamente indisponível em vez de repetir silenciosamente a prévia truncada.
    - Imagens do assistente/geradas são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, para que recarregamentos não dependam de payloads brutos de imagem em base64 permanecerem na resposta do histórico do chat.
    - Ao renderizar `chat.history`, a Control UI remove do texto visível do assistente tags de diretiva inline somente de exibição (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamada de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta), e tokens de controle de modelo vazados em ASCII/largura total, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply` ou o token de confirmação de heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização de chat mantém mensagens locais otimistas do usuário/assistente visíveis se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais quando o histórico do Gateway alcança o estado atual.
    - Eventos `chat` ao vivo são estado de entrega, enquanto `chat.history` é reconstruído a partir da transcrição durável da sessão. Após eventos finais de ferramentas, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição é documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` acrescenta uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações somente de UI (sem execução de agente, sem entrega por canal).
    - A barra lateral lista sessões recentes com uma ação Nova Sessão, um link Todas as Sessões e um botão de busca de sessão que abre o seletor completo de sessões (escopado pelo agente selecionado, com busca e paginação). Uma nova sessão de dashboard recebe assincronamente um título conciso gerado a partir de sua primeira mensagem que não seja comando; nomes explícitos nunca são substituídos. Defina `agents.defaults.utilityModel` (ou `agents.list[].utilityModel`) para rotear essa chamada de modelo separada para um modelo de menor custo. Trocar de agente mostra apenas sessões vinculadas a esse agente e recai para a sessão principal desse agente quando ele ainda não tem sessões de dashboard salvas.
    - Cada linha do seletor de sessões pode renomear, fixar ou arquivar a sessão. Uma execução ativa e a sessão principal de um agente não podem ser arquivadas. Arquivar a sessão selecionada no momento troca o Chat de volta para a sessão principal desse agente.
    - Em larguras de desktop, os controles de chat permanecem em uma única linha compacta e recolhem ao rolar para baixo na transcrição; rolar para cima, voltar ao topo ou chegar ao final restaura os controles.
    - Mensagens consecutivas duplicadas contendo apenas texto são renderizadas como um único balão com um badge de contagem. Mensagens que carregam imagens, anexos, saída de ferramenta ou prévias de canvas não são recolhidas.
    - Os seletores de modelo e thinking do cabeçalho do chat aplicam patch à sessão ativa imediatamente por meio de `sessions.patch`; eles são substituições persistentes da sessão, não opções de envio válidas apenas por um turno.
    - Se você enviar uma mensagem enquanto uma alteração no seletor de modelo para a mesma sessão ainda estiver sendo salva, o composer aguarda esse patch de sessão antes de chamar `chat.send`, para que o envio use o modelo selecionado.
    - Digitar `/new` na Control UI cria e troca para a mesma nova sessão de dashboard que Novo Chat, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, ela redefine a sessão principal no lugar. Digitar `/reset` mantém a redefinição explícita no lugar do Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada no Gateway. Se `agents.defaults.models` estiver presente, essa allowlist conduz o seletor, incluindo entradas `provider/*` que mantêm catálogos escopados por provedor dinâmicos. Caso contrário, o seletor mostra entradas explícitas de `models.providers.*.models` além de provedores com autenticação utilizável. O catálogo completo continua disponível pelo RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios recentes de uso de sessão do Gateway incluem tokens de contexto atuais, a barra de ferramentas do composer de chat mostra um pequeno anel de uso de contexto com a porcentagem usada; o detalhe completo dos tokens fica em seu tooltip. O anel muda para estilo de aviso sob alta pressão de contexto e, em níveis recomendados de Compaction, mostra um botão compacto que executa o caminho normal de Compaction da sessão. Snapshots de token obsoletos ficam ocultos até que o Gateway reporte uso recente novamente.

  </Accordion>
  <Accordion title="Modo de conversa (tempo real no navegador)">
    O modo de conversa usa um provedor de voz em tempo real registrado. Configure OpenAI com `talk.realtime.provider: "openai"` mais um perfil de autenticação de chave de API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY`; perfis OAuth da OpenAI não configuram voz Realtime. Configure Google com `talk.realtime.provider: "google"` mais `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API de provedor padrão. A OpenAI recebe um segredo efêmero de cliente Realtime para WebRTC. O Google Live recebe um token de autenticação de Live API restrito e de uso único para uma sessão WebSocket no navegador, com instruções e declarações de ferramentas bloqueadas no token pelo Gateway. Provedores que expõem apenas uma ponte realtime de backend executam pelo transporte de relay do Gateway, de modo que credenciais e sockets de fornecedor permanecem no servidor enquanto o áudio do navegador passa por RPCs autenticados do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instrução fornecidas pelo chamador.

    O composer do Chat inclui um botão de opções de conversa ao lado do botão iniciar/parar conversa. As opções se aplicam à próxima sessão de conversa e podem substituir provedor, transporte, modelo, voz, esforço de raciocínio, limiar de VAD, duração de silêncio e preenchimento de prefixo. Quando uma opção está em branco, o Gateway usa padrões configurados quando disponíveis ou o padrão do provedor. Selecionar relay do Gateway força o caminho de relay do backend; selecionar WebRTC mantém a sessão pertencente ao cliente e falha em vez de recorrer silenciosamente ao relay se o provedor não conseguir criar uma sessão de navegador.

    No composer do Chat, o controle de conversa é o botão de ondas ao lado do botão de ditado por microfone. Quando a conversa começa, a linha de status do composer mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por meio de `talk.client.toolCall`.

    Smoke ao vivo de mantenedor: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a ponte WebSocket de backend da OpenAI, a troca SDP de WebRTC no navegador da OpenAI, a configuração de WebSocket no navegador com token restrito do Google Live e o adaptador de navegador do relay do Gateway com mídia de microfone falsa. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Parar** (chama `chat.abort`).
    - Enquanto uma execução está ativa, acompanhamentos normais entram na fila. Clique em **Direcionar** em uma mensagem na fila para injetar esse acompanhamento no turno em execução.
    - Digite `/stop` (ou frases autônomas de abortar como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial após abortar">
    - Quando uma execução é abortada, texto parcial do assistente ainda pode ser mostrado na UI.
    - O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer.
    - Entradas persistidas incluem metadados de abortar para que consumidores da transcrição consigam distinguir parciais abortadas da saída de conclusão normal.

  </Accordion>
</AccordionGroup>

## Instalação de PWA e Web Push

A Control UI distribui um `manifest.webmanifest` e um service worker, então navegadores modernos podem instalá-la como uma PWA independente. Web Push permite que o Gateway desperte a PWA instalada com notificações mesmo quando a aba ou janela do navegador não está aberta.

Se a página mostrar **Incompatibilidade de protocolo** logo após uma atualização do OpenClaw, primeiro reabra o dashboard com `openclaw dashboard` e faça uma atualização forçada da página. Se ainda falhar, limpe os dados do site para a origem do dashboard ou teste em uma janela privada do navegador; uma aba antiga ou cache de service worker do navegador pode continuar executando um pacote da Control UI anterior à atualização contra o Gateway mais novo.

| Superfície                                             | O que faz                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto PWA. Navegadores oferecem "Instalar app" assim que ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (sob o diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar payloads de Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura de navegador persistidos.                  |

Substitua o par de chaves VAPID por variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações multi-host, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `https://openclaw.ai`)

A Control UI usa estes métodos do Gateway restritos por escopo para registrar e testar assinaturas de navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
Web Push é independente do caminho de relay APNS do iOS (consulte [Configuração](/pt-BR/gateway/configuration) para push apoiado por relay) e do método `push.test` existente, que mira o pareamento móvel nativo.
</Note>

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desativa a execução de scripts dentro de embeds hospedados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interativos mantendo o isolamento de origem; este é o padrão e geralmente é suficiente para jogos/widgets de navegador autocontidos.
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
Use `trusted` somente quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos e canvases interativos gerados por agentes, `scripts` é a escolha mais segura.
</Warning>

URLs de incorporação externas absolutas `http(s)` continuam bloqueadas por padrão. Se você quiser intencionalmente que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura das mensagens de chat

Mensagens de chat agrupadas usam uma largura máxima padrão legível. Implantações em monitores largos podem substituí-la sem modificar o CSS empacotado definindo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

O valor é validado antes de chegar ao navegador. Os valores compatíveis incluem comprimentos simples e porcentagens, como `960px` ou `82%`, além de expressões de largura restritas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Acesso ao tailnet (recomendado)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, as solicitações do Control UI/WebSocket Serve podem autenticar por cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o com o cabeçalho, e só aceita esses cabeçalhos quando a solicitação chega ao loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da Control UI com identidade de dispositivo do navegador, esse caminho Serve verificado também ignora a ida e volta de pareamento do dispositivo; navegadores sem dispositivo e conexões com função de nó ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para tráfego Serve. Então use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade Serve, tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações de limite de taxa. Portanto, novas tentativas inválidas concorrentes do mesmo navegador podem mostrar `retry later` na segunda solicitação, em vez de duas incompatibilidades simples competindo em paralelo.

    <Warning>
    A autenticação Serve sem token pressupõe que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Então abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da UI (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o painel por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador é executado em um **contexto não seguro** e bloqueia o WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da Control UI sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade de HTTP inseguro somente em localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida de operador da Control UI por meio de `gateway.auth.mode: "trusted-proxy"`
- recurso de emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
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

    - Ela permite que sessões da Control UI em localhost prossigam sem identidade de dispositivo em contextos HTTP não seguros.
    - Ela não ignora verificações de pareamento.
    - Ela não relaxa os requisitos de identidade de dispositivo remoto (não localhost).

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` desativa as verificações de identidade de dispositivo da Control UI e é uma redução grave de segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - A autenticação trusted-proxy bem-sucedida pode admitir sessões de **operador** da Control UI sem identidade de dispositivo.
    - Isso **não** se estende a sessões da Control UI com função de nó.
    - Proxies reversos local loopback no mesmo host ainda não satisfazem a autenticação trusted-proxy; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração de HTTPS.

## Política de segurança de conteúdo

A Control UI é fornecida com uma política `img-src` restrita: somente ativos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagem remotas `http(s)` e relativas a protocolo são rejeitadas pelo navegador e não geram buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) ainda são renderizados, incluindo rotas de avatar autenticadas que a UI busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` ainda são renderizadas (útil para payloads dentro do protocolo).
- URLs `blob:` locais criadas pela Control UI ainda são renderizadas.
- URLs de avatar remotas emitidas por metadados de canais são removidas nos auxiliares de avatar da Control UI e substituídas pelo logotipo/selo integrado, portanto um canal comprometido ou malicioso não pode forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativo e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente a chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (correspondendo à rota irmã assistant-media). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estão protegidos.
- A própria Control UI encaminha o token do gateway como cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem ainda seja renderizada nos painéis.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também se torna não autenticada, alinhada ao restante do gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do gateway está configurada, pré-visualizações de mídia local do assistente usam uma rota em duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da Control UI. O navegador envia o token do gateway como cabeçalho bearer ao verificar disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração com escopo limitado ao caminho de origem exato.
- URLs de imagem, áudio, vídeo e documento renderizadas pelo navegador usam `mediaTicket=<ticket>` em vez do token ou senha ativo do gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

Isso mantém a renderização normal de mídia compatível com elementos de mídia nativos do navegador sem colocar credenciais reutilizáveis do gateway em URLs de mídia visíveis.

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

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

Então aponte a UI para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Página em branco da Control UI

Se o navegador carregar um painel em branco e o DevTools não mostrar nenhum erro útil, uma extensão ou script de conteúdo inicial pode ter impedido que o aplicativo de módulo JavaScript fosse avaliado. A página estática inclui um painel de recuperação em HTML simples que aparece quando `<openclaw-app>` não é registrado após a inicialização.

Use a ação **Tentar novamente** do painel após alterar o ambiente do navegador, ou recarregue manualmente após estas verificações:

- Desative extensões que injetam em todas as páginas, especialmente extensões com scripts de conteúdo `<all_urls>`.
- Tente uma janela privada, um perfil de navegador limpo ou outro navegador.
- Mantenha o Gateway em execução e verifique a mesma URL do painel após a alteração no navegador.

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Control UI é composta por arquivos estáticos; o destino WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite localmente, mas o Gateway é executado em outro lugar.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
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
  <Accordion title="Notes">
    - `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
    - Se você passar um endpoint completo `ws://` ou `wss://` via `gatewayUrl`, codifique o valor de `gatewayUrl` em URL para que o navegador analise a query string corretamente.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de solicitação e Referer. Parâmetros de consulta legados `?token=` ainda são importados uma vez para compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas na memória.
    - Quando `gatewayUrl` está definido, a UI não faz fallback para credenciais de configuração ou ambiente. Forneça `token` (ou `password`) explicitamente. A ausência de credenciais explícitas é um erro.
    - Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para impedir clickjacking.
    - Implantações públicas não loopback da Control UI devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Carregamentos privados de mesma origem em LAN/Tailnet a partir de loopback, RFC1918/link-local, `.local`, `.ts.net` ou hosts CGNAT do Tailscale são aceitos sem ativar fallback por cabeçalho Host.
    - A inicialização do Gateway pode semear origens locais como `http://localhost:<port>` e `http://127.0.0.1:<port>` a partir do bind e da porta efetivos em runtime, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]`, exceto para testes locais rigorosamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder a qualquer host que eu esteja usando."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa o modo de fallback por origem do cabeçalho Host, mas é um modo de segurança perigoso.

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
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento de integridade do gateway
- [TUI](/pt-BR/web/tui) — interface de usuário no terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
