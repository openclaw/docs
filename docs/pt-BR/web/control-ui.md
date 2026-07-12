---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada em navegador para o Gateway (chat, atividade, nodes, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-07-12T21:34:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b1da56979bd134ce0be8ab0a2fbee658952515db5e422fbe9eb685968de8a755
    source_path: web/control-ui.md
    workflow: 16
---

A Interface de Controle é um pequeno aplicativo de página única em **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/)).

Se a página não carregar, inicie primeiro o Gateway: `openclaw gateway`.

<Note>
Em associações de LAN nativas do Windows, o Firewall do Windows ou uma Política de Grupo gerenciada pela organização ainda pode bloquear a URL de LAN anunciada, mesmo quando `127.0.0.1` funciona no host do Gateway. Execute `openclaw gateway status --deep` no host Windows; o comando relata portas provavelmente bloqueadas, incompatibilidades de perfil e regras locais de firewall que a política pode ignorar.
</Note>

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da aba atual do navegador e para a URL do gateway selecionada; as senhas não são persistidas. A integração inicial geralmente gera um token do gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Conectar-se por um novo navegador ou dispositivo geralmente exige uma **aprovação de pareamento única**, exibida como `disconnected (1008): pairing required`.

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

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado; execute novamente `openclaw devices list` antes de aprovar.

A mudança de um navegador já pareado do acesso de leitura para o acesso de gravação/administrador é tratada como uma atualização de aprovação, não como uma reconexão silenciosa: o OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão com acesso mais amplo e solicita que você aprove explicitamente o novo conjunto de escopos.

Após a aprovação, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você a revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte a [CLI de dispositivos](/pt-BR/cli/devices) para rotação de tokens, revogação e o fluxo de aprovação da primeira execução do Paperclip / `openclaw_gateway`.

<Note>
- Conexões diretas de navegador pelo loopback local (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode ignorar a etapa de ida e volta do pareamento para sessões de operador da Interface de Controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo. Navegadores sem dispositivo e conexões com função de Node ainda seguem as verificações normais de dispositivo.
- Associações diretas à Tailnet, conexões de navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo exclusivo; portanto, trocar de navegador ou limpar os dados do navegador exige um novo pareamento.

</Note>

## Parear um dispositivo móvel

Um administrador já pareado pode criar o QR de conexão para iOS/Android sem abrir um terminal:

<Steps>
  <Step title="Abrir o pareamento móvel">
    Selecione **Dispositivos** e clique em **Parear dispositivo móvel** no cartão **Dispositivos**.
  </Step>
  <Step title="Conectar o telefone">
    No aplicativo móvel do OpenClaw, abra **Configurações** → **Gateway** e escaneie o código QR. Como alternativa, você pode copiar e colar o código de configuração.
  </Step>
  <Step title="Confirmar a conexão">
    O aplicativo oficial para iOS/Android se conecta automaticamente. Se **Aprovação pendente** exibir uma solicitação, revise a função e os escopos antes de aprová-la.
  </Step>
</Steps>

A criação de um código de configuração exige `operator.admin`; o botão fica desativado em sessões sem esse escopo. Um código de configuração contém uma credencial de inicialização de curta duração; portanto, trate o QR e o código copiado como uma senha enquanto forem válidos. Para o pareamento remoto, o Gateway deve ser resolvido como `wss://` (por exemplo, por meio do Tailscale Serve/Funnel); `ws://` simples é limitado ao loopback e a endereços de LAN privada. Consulte [Pareamento](/pt-BR/channels/pairing#pair-from-the-control-ui-recommended) para obter todos os detalhes de segurança e fallback.

## Identidade pessoal (local do navegador)

A Interface de Controle oferece uma identidade pessoal por navegador (nome de exibição e avatar) anexada às mensagens enviadas, para atribuição em sessões compartilhadas. Ela reside no armazenamento do navegador, com escopo limitado ao perfil atual do navegador, e não é sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais de autoria da transcrição nas mensagens enviadas. Limpar os dados do site ou trocar de navegador redefine essa identidade como vazia.

A substituição do avatar do assistente segue o mesmo padrão local do navegador: as substituições carregadas são sobrepostas localmente à identidade resolvida pelo gateway e nunca fazem o trajeto de ida e volta por `config.patch`. O campo compartilhado de configuração `ui.assistant.avatar` continua disponível para clientes que não usam a interface e gravam o campo diretamente.

## Endpoint de configuração do runtime

A Interface de Controle obtém suas configurações de runtime de `/control-ui-config.json`, resolvido em relação ao caminho base da Interface de Controle do gateway (por exemplo, `/__openclaw__/control-ui-config.json` sob o caminho base `/__openclaw__/`). Esse endpoint é protegido pela mesma autenticação do gateway usada pelo restante da superfície HTTP: navegadores não autenticados não podem acessá-lo, e uma solicitação bem-sucedida exige um token/senha válido do gateway, uma identidade do Tailscale Serve ou uma identidade de proxy confiável.

## Status do host do Gateway

Abra **Configurações** na visualização Simples para ver o cartão **Host do Gateway** com a máquina do Gateway, o endereço de LAN, o sistema operacional, o runtime, o tempo de atividade, a carga da CPU, a memória e o espaço em disco do volume de estado. O cartão é atualizado a cada 10 segundos enquanto está visível por meio do RPC `system.info` do Gateway, que exige o escopo `operator.read`. Gateways mais antigos e conexões sem esse escopo omitem o cartão.

## Suporte a idiomas

A Interface de Controle se localiza na primeira inicialização com base na localidade do navegador. Para substituí-la posteriormente, abra **Configurações -> Geral -> Idioma** (o seletor fica no cartão de configurações rápidas Geral, não em Aparência).

- Localidades compatíveis: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- As traduções para idiomas diferentes do inglês são carregadas sob demanda no navegador.
- A localidade selecionada é salva no armazenamento do navegador e reutilizada em visitas futuras.
- As chaves de tradução ausentes usam o inglês como fallback.

As traduções da documentação são geradas para o mesmo conjunto de localidades diferentes do inglês, mas o seletor de idioma integrado do site da documentação do Mintlify lista apenas os códigos de localidade aceitos pelo Mintlify. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência inclui os temas integrados Claw, Knot e Dash (Claw é o padrão), além de um slot local do navegador para importação do tweakcn. Para importar um tema, abra o [editor do tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Share** e cole o link copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs do editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs de tema brutos e nomes de temas padrão, como `amethyst-haze`.

Os temas importados são armazenados somente no perfil atual do navegador; eles não são gravados na configuração do gateway nem sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo retorna ao Claw caso o tema importado estivesse ativo.

Aparência também inclui uma configuração local do navegador para o tamanho do texto, armazenada com o restante das preferências da Interface de Controle. Ela se aplica ao texto do chat, ao texto do compositor, aos cartões de ferramentas e às barras laterais do chat, e mantém as entradas de texto com pelo menos 16px para evitar que o Safari em dispositivos móveis aplique zoom automático ao receber foco.

## Gerenciar plugins

Abra **Plugins** na barra lateral ou use `/settings/plugins` em relação ao
caminho base configurado da Interface de Controle para procurar e gerenciar plugins sem sair
da Interface de Controle. Por exemplo, um caminho base `/openclaw` usa
`/openclaw/settings/plugins`. A página está sempre disponível, mesmo quando todos os
plugins opcionais estão desativados.

Plugins é uma central com quatro abas: **Instalados** e **Descobrir** gerenciam o código dos plugins
em `/settings/plugins`, **Skills** hospeda o gerenciador de Skills por agente em
`/skills`, e **Workshop** hospeda a análise de propostas do Skill Workshop em
`/skills/workshop`. Cada aba mantém sua própria URL, e a barra lateral exibe a
entrada única Plugins para todas elas.

A aba **Instalados** exibe o inventário local completo agrupado por categoria, com
contagens gerais. Cada linha abre uma visualização de detalhes; seu menu de opções (`…`)
ativa ou desativa o plugin e oferece **Remover** para plugins instalados externamente.
Ela também lista os [servidores MCP](/pt-BR/cli/mcp) configurados e permite adicioná-los, desativá-los
e removê-los diretamente. A aba **Descobrir** é a loja: plugins em destaque
incluídos no OpenClaw, plugins externos oficiais e conectores MCP de um clique
para serviços populares. Digitar na caixa de pesquisa consulta o
[ClawHub](https://clawhub.ai/plugins) diretamente e acrescenta uma seção **Do ClawHub**
com contagens de downloads e selos de verificação de origem. Links diretos podem
apontar diretamente para a loja com `/settings/plugins?tab=discover`.

A aba **Skills** mantém o relatório de status das Skills, os controles de ativação/desativação, a entrada da chave de API
e a pesquisa de Skills do ClawHub diretamente na página, com escopo limitado ao agente selecionado. A
aba **Workshop** mantém o quadro do Skill Workshop e o fluxo de análise Hoje para
[propostas de Skills](/pt-BR/tools/skill-workshop).

Os plugins incluídos já estão presentes no Gateway e exibem **Ativar** ou
**Desativar** em vez de **Instalar**. Por exemplo, o Workboard está incluído no
OpenClaw, mas desativado por padrão; portanto, sua ação é **Ativar**. Plugins integrados
não podem ser removidos, apenas desativados.

A leitura do catálogo e a pesquisa no ClawHub exigem `operator.read`. Instalar,
ativar, desativar ou remover um plugin e alterar servidores MCP exigem
`operator.admin`; essas ações permanecem desativadas para operadores somente leitura.

As instalações pelo ClawHub são executadas por meio do Gateway e mantêm as mesmas verificações de confiança, integridade
e política de instalação de plugins que outras instalações intermediadas pelo Gateway. A instalação
ou remoção do código de um plugin exige a reinicialização do Gateway. A ativação ou desativação de um
plugin instalado pode ser aplicada sem reinicialização quando o plugin e o runtime atual do
Gateway oferecem suporte a isso; caso contrário, a interface informa que uma reinicialização é
necessária. Conectores MCP baseados em OAuth exigem uma execução única de
`openclaw mcp login <name>` pela CLI depois de serem adicionados.

A página se concentra intencionalmente em inventário, descoberta, instalação, ativação
e remoção. Use [`openclaw plugins`](/pt-BR/cli/plugins) para fontes arbitrárias do npm, git ou
caminho local, atualizações e configuração avançada de plugins.

## Navegação da barra lateral

A barra lateral fixa a navegação acima de uma lista rolável de sessões. Em configurações com vários agentes, cada agente aparece como uma seção recolhível de nível superior; expandir um agente permite navegar por suas sessões sem sair do chat aberto, e agentes recolhidos exibem um indicador de mensagens não lidas. Dentro de um agente, a lista é dividida em **Fixadas**, uma seção integrada para cada canal conectado (Telegram, Slack, WhatsApp, ...), uma seção integrada **Trabalho** para sessões vinculadas a uma árvore de trabalho gerenciada ou a um nó de execução (as linhas mostram uma linha `repo ⎇ branch` e o host do nó), grupos personalizados (a `category` da sessão) e **Chats** para as demais. As seções de canais e Trabalho classificam as linhas automaticamente; atribuir uma sessão a um grupo personalizado sempre prevalece. Abrir uma sessão move o destaque da seleção sem reordenar as linhas. Sessões com novas atividades desde a última leitura exibem um ponto de não lida, e abrir uma delas a marca como lida. Cada linha de sessão tem um menu de contexto (botão de três pontos verticais ou clique com o botão direito) com Fixar/Desafixar, Marcar como não lida/lida, Renomear, Bifurcar, Mover para o grupo (incluindo Novo grupo e Remover do grupo), Arquivar e Excluir; layouts para toque mantêm visíveis os controles diretos de fixação e menu. Cmd/Ctrl-clique alterna as linhas para uma seleção múltipla, e Shift-clique estende a seleção pela ordem visível; abrir o menu em uma linha selecionada oferece ações em lote (Marcar N como não lidas/lidas, Mover N para o grupo, Arquivar N, Excluir N), aplicadas a todas as sessões selecionadas, com uma única confirmação para a exclusão em lote. Arraste uma sessão para um grupo personalizado ou para **Chats** a fim de movê-la. Os cabeçalhos de grupos personalizados podem ser recolhidos, expandidos ou arrastados para reordená-los; os nomes dos grupos e sua ordem ficam no gateway (`sessions.groups.*`), portanto acompanham você entre navegadores, enquanto o estado recolhido permanece no perfil do navegador. Os cabeçalhos de grupo também têm um menu (botão de três pontos verticais ou clique com o botão direito) com Renomear grupo, Novo grupo e Excluir grupo; renomear ou excluir um grupo atualiza no servidor todas as sessões que fazem parte dele, inclusive as arquivadas, e excluir um grupo mantém suas sessões e as move de volta para Chats. O único **+** no cabeçalho da lista de sessões abre a página Nova sessão (veja abaixo). O controle de ordenação também tem uma opção Agrupar por: Agrupadas (padrão) ou Nenhum para uma única lista simples (Fixadas permanece separada); a escolha é armazenada no perfil atual do navegador. **Uso**, **Automações** e **Plugins** ficam fixados por padrão; expanda **Mais** para acessar todos os outros destinos. Selecione **Editar itens fixados** em Mais ou clique com o botão direito na área de navegação para fixar ou desafixar destinos e restaurar os padrões. O conjunto fixado e o estado de expansão de Mais são armazenados no perfil atual do navegador e persistem após recarregamentos.

## Página Nova sessão

O **+** no cabeçalho da lista de sessões da barra lateral abre um rascunho em tela cheia em `/new`: nada é criado até você enviar a primeira mensagem. Uma linha de destino acima da caixa de mensagem seleciona onde a sessão trabalha: o agente (configurações com vários agentes), onde a execução ocorre (**Gateway · local** ou um nó pareado que exponha `system.run`; requer `operator.admin`), a pasta (o padrão é o espaço de trabalho do agente; outros caminhos absolutos do Gateway requerem `operator.admin` e uma árvore de trabalho) e uma opção **Árvore de trabalho** opcional com um seletor de branch base (fornecido por `worktrees.branches`, portanto nenhuma busca remota ocorre) e um nome opcional para a árvore de trabalho (a branch se torna `openclaw/<name>`). O botão de navegação do chip da pasta abre um seletor de diretórios embutido, fornecido pelo método `fs.listDir`, exclusivo para administradores. Seu nível superior mostra o Gateway e todos os nós conhecidos; nós offline e nós sem suporte à navegação em diretórios permanecem visíveis, mas desabilitados. Selecionar o Gateway começa pela pasta atual ou pelo diretório inicial do Gateway. Selecionar um nó compatível permite navegar pelo sistema de arquivos do host desse nó, vincula a execução a ele e usa diretamente o caminho absoluto selecionado no nó (árvores de trabalho gerenciadas continuam exclusivas do Gateway). O envio chama `sessions.create` com a primeira mensagem, portanto a execução começa na mesma troca de ida e volta e a interface salta para o chat da nova sessão. Se o Gateway criar a sessão, mas rejeitar esse primeiro envio, o chat preserva o prompt e o erro após recarregamentos; **Tentar novamente** envia a mensagem pela sessão já criada, em vez de criar outra.

Dentro de **Configurações**, a barra lateral dedicada começa com um campo **Pesquisar configurações** para encontrar rapidamente as seções de configurações.

  Um campo **Pesquisar** no topo da barra lateral abre a paleta de comandos (⌘K). Clicar na marca OpenClaw no cabeçalho da barra lateral abre a tela inicial limpa de Nova sessão. Quando algo exige ação — tarefas cron com falha ou atrasadas, autenticação de modelo prestes a expirar ou expirada — indicadores compactos de atenção aparecem acima do rodapé da barra lateral e levam à página responsável ao serem clicados. O rodapé compacto mantém juntos o status da conexão, **Configurações**, **Documentação**, o pareamento móvel e o seletor de modo de cor claro/escuro/sistema; quando o Gateway é executado a partir de um checkout do código-fonte em uma ramificação diferente de `main`, o rodapé também exibe o nome dessa ramificação em vermelho, deixando evidente à primeira vista que o Gateway não é de uma versão de lançamento (instalações de versões de lançamento nunca o exibem). Shift-Command-Comma abre **Configurações** sem substituir o atalho Command-Comma do navegador. O cabeçalho da barra lateral também contém o controle de recolhimento (⌘B); recolhê-la oculta completamente a barra lateral para proporcionar um espaço de trabalho em largura total, e um controle flutuante de expansão (ou ⌘B) a traz de volta; no aplicativo para macOS, esse controle fica hospedado de forma nativa na barra de título. A barra lateral é o único elemento de navegação no desktop, sem barra superior. Em janelas estreitas, a barra lateral é substituída por uma gaveta deslizante atrás de uma linha de cabeçalho compacta que contém o controle da gaveta, a marca e a pesquisa da paleta de comandos; no aplicativo para macOS, essa linha de cabeçalho integra o espaço reservado da barra de título em uma única faixa compacta ao lado dos controles da janela. A navegação usa o histórico normal do navegador, portanto os botões voltar/avançar do navegador a percorrem; o aplicativo para macOS adiciona um controle nativo da barra lateral ao lado dos controles da janela, além de gestos de deslizar no trackpad, com botões voltar/avançar na borda direita da barra lateral quando ela está expandida e botões nativos de pesquisa (paleta de comandos) e nova sessão quando ela está recolhida.

  ## O que ele pode fazer (atualmente)

  <AccordionGroup>
  <Accordion title="Chat e conversa">
    - Converse com o modelo pelo Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - As atualizações do histórico do chat solicitam uma janela recente limitada, com limites de texto por mensagem, para que sessões grandes não obriguem o navegador a renderizar a carga completa da transcrição antes que o chat possa ser usado.
    - Passar o mouse ou mover o foco do teclado para um link público de issue ou pull request do GitHub exibe seu estado, título, autor, atividade recente, comentários e estatísticas de alterações. O Gateway conectado busca e armazena em cache os metadados públicos sem alterar o destino do link, inclusive quando a interface usa um Gateway remoto. O Gateway usa `GH_TOKEN` ou `GITHUB_TOKEN` quando disponível, após confirmar que o repositório é público; caso contrário, usa a API anônima do GitHub com um cache mais duradouro.
    - Converse por meio de sessões em tempo real no navegador. A OpenAI usa WebRTC direto, o Google Live usa um token de navegador restrito e de uso único por WebSocket, e plugins de voz em tempo real exclusivos do backend usam o transporte de retransmissão do Gateway. Sessões de provedor controladas pelo cliente começam com `talk.client.create`; sessões de retransmissão do Gateway começam com `talk.session.create`. A retransmissão mantém as credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por `talk.session.appendAudio`, encaminha chamadas de ferramenta do provedor `openclaw_agent_consult` por `talk.client.toolCall` para aplicação das políticas do Gateway e uso do modelo OpenClaw maior configurado, e direciona a condução por voz da execução ativa por `talk.client.steer` ou `talk.session.steer`.
    - Transmita chamadas de ferramentas e cartões de saída de ferramentas em tempo real no Chat (eventos do agente). A atividade das ferramentas é renderizada como linhas específicas por tipo: comandos de shell exibem o comando com realce de sintaxe e saída no estilo de terminal; chamadas compatíveis de edição e gravação exibem diffs embutidos limitados, números de linha quando disponíveis e estatísticas de `+added -removed`; e chamadas consecutivas são recolhidas em um resumo como "Executou 13 comandos, leu 6 arquivos, editou 9 arquivos". Enquanto uma execução está ativa, a chamada em execução mais recente dá nome ao cabeçalho do grupo. Expanda uma linha para inspecionar os argumentos restantes e a saída bruta.
    - Títulos opcionais de finalidade gerados por IA para chamadas de ferramentas complexas (comandos de shell longos, ferramentas de plugins com muitos argumentos), habilitados com `gateway.controlUi.toolTitles: true` (desativados por padrão). Os títulos vêm do método `chat.toolTitles` em lote por meio do roteamento padrão do modelo utilitário — um `utilityModel` explícito (provedor escolhido pelo operador, como em outras tarefas utilitárias) ou, na ausência dele, o modelo pequeno padrão declarado pelo provedor da sessão — e são armazenados em cache pelo Gateway por agente. Quando a opção não está habilitada ou nenhum modelo de baixo custo pode ser usado, as linhas mantêm seus rótulos determinísticos e nenhuma chamada de modelo é realizada.
    - Inicie ou descarte tarefas de acompanhamento efêmeras sugeridas pelo modelo; sugestões aceitas abrem uma nova sessão de árvore de trabalho gerenciada com o prompt proposto.
    - Aba Atividade com resumos locais do navegador, priorizando a redação de dados confidenciais, da atividade de ferramentas em tempo real proveniente da entrega existente de eventos `session.tool` / eventos de ferramentas.

  </Accordion>
  <Accordion title="Canais, sessões e memória">
    - Canais: status dos canais integrados e dos canais de plugins incluídos/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - As atualizações de sondagem dos canais mantêm o instantâneo anterior visível enquanto as verificações lentas dos provedores são concluídas e identificam instantâneos parciais quando uma sondagem ou auditoria excede seu limite de tempo na interface.
    - Sessões: liste por padrão as sessões dos agentes configurados, fixe sessões frequentes, renomeie-as, arquive ou restaure sessões inativas, recupere-se de chaves obsoletas de sessões de agentes não configurados e aplique substituições de modelo/pensamento/modo rápido/detalhamento/rastreamento/raciocínio por sessão (`sessions.list`, `sessions.patch`). Sessões fixadas são ordenadas acima das sessões recentes não fixadas; sessões arquivadas ficam na visualização de arquivadas da página Sessões e mantêm suas transcrições. As linhas exibem um ponto de não lida para sessões com atividade desde a última leitura, com ações para marcar como não lida/lida (`sessions.patch { unread }`), e uma ação Bifurcar que ramifica a transcrição em uma nova sessão (`sessions.create { parentSessionKey, fork: true }`). Blocos de visão geral acima da tabela resumem o conjunto carregado (quantidade de sessões, execuções ativas, sessões não lidas, total de tokens), cada linha contém um glifo de tipo com um ponto de execução ativa, o status é renderizado como um ponto simples acompanhado de um rótulo, e a coluna Tokens exibe um medidor de uso da janela de contexto quando a sessão informa os tamanhos de tokens e de contexto. As ações de gerenciamento ficam em um menu por linha (botão de reticências verticais ou clique com o botão direito), correspondente ao menu de sessão da barra lateral, e a gaveta da linha apresenta o runtime do agente e a duração da execução junto aos outros detalhes da sessão.
    - Agrupamento de sessões: um controle Agrupar por organiza a tabela de sessões em seções por grupos personalizados, canal, tipo, agente ou data. Os grupos personalizados persistem por sessão por meio de `sessions.patch` (`category`), de modo que as sessões iniciadas em canais de mensagens (Discord, Telegram, WhatsApp, ...) também possam ser categorizadas; atribua grupos arrastando linhas para uma seção ou usando o seletor de grupo de cada linha, e crie grupos com a ação Novo grupo.
    - Memória (uma aba na página Agentes, no escopo do agente selecionado): status de Dreaming, controle para habilitar/desabilitar e leitor do Diário de Sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, tarefas, plugins, skills, dispositivos, aprovações de execução">
    - Automações (tarefas cron): cartões de estatísticas (quantidade de automações, quantidade com falha, estado do agendador, próxima ativação) acima de um seletor de abas Automações/Histórico de execuções; a aba Automações lista as tarefas em uma tabela filtrável (Todas/Ativas/Pausadas, pesquisa, filtros de agendamento e última execução, menu de ações por linha) com sugestões iniciais abaixo, e a aba Histórico de execuções mostra execuções recentes de todas as automações (`cron.*`).
    - Tarefas: registro em tempo real de tarefas em segundo plano ativas e recentes, com sessões vinculadas e cancelamento (`tasks.*`).
    - Plugins: navegue pelo inventário instalado e pela loja selecionada, pesquise no ClawHub, instale e remova código de plugins e ative ou desative plugins instalados (`plugins.*`); as linhas de servidores MCP editam `mcp.servers` por meio dos métodos de configuração.
    - Skills: status, ativação/desativação, instalação e atualizações de chave de API (`skills.*`).
    - Dispositivos: um único inventário reúne registros de dispositivos pareados, o catálogo de nós e a presença em tempo real (`device.pair.list`, `node.list`, `system-presence`). O host do Gateway fica fixado primeiro; clientes pareados mostram o status da conexão, funções, tokens, recursos e comandos. Pareamentos duplicados são agrupados em um grupo expansível, e **Limpar N obsoletos** remove em massa duplicatas offline confirmadas pelo administrador que foram aprovadas automaticamente (local silencioso, CIDR confiável ou verificadas por SSH) ou que são anteriores à procedência da aprovação. As entradas podem ser removidas (`node.pair.remove`, `device.pair.remove`), enquanto o pareamento de dispositivos e as novas aprovações de nós são tratados diretamente na interface (`device.pair.*`, `node.pair.approve`/`reject`), e os códigos de configuração para dispositivos móveis são criados no mesmo cartão.
    - Aprovações de execução: edite listas de permissões do Gateway ou de nós e a política de confirmação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuração">
    - Visualize/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Perfil: uma página de configurações que mostra a identidade do agente padrão com estatísticas de uso de todo o período — tokens acumulados, dia de pico, sessão mais longa, sequências de atividade, um mapa de calor anual de tokens, principais ferramentas e destaques de canais (`usage.cost`, `sessions.usage`).
    - O MCP tem uma página de configurações dedicada com linhas de servidores somente leitura (transporte, ativação, resumos de OAuth/filtros/paralelismo), comandos comuns para operadores e o editor de configuração com escopo `mcp`; a adição, ativação/desativação e remoção de servidores ocorre na página Plugins.
    - Provedores de modelos: uma página de configurações que lista todos os provedores de modelos configurados, com o ícone da marca, estado de autenticação (`models.authStatus`), disponibilidade de modelos (`models.list`), dados em tempo real de plano/cota/faturamento quando informados pelo provedor (`usage.status`) e gastos das sessões locais nos últimos 30 dias (`sessions.usage`). Uma ação Atualizar relê o estado das credenciais e o uso do provedor.
    - Conexão: uma página de configurações (em **Conexões**) responsável pelo próprio vínculo do painel com o Gateway — URL WebSocket, token do Gateway, senha e chave de sessão padrão — além do snapshot do handshake mais recente (status, tempo de atividade, intervalo de pulsos, última atualização dos canais). A tela de login offline trata o caso desconectado; esta página edita a conexão enquanto ela está ativa.
    - Aplique e reinicie com validação (`config.apply`) e, em seguida, reative a última sessão ativa.
    - As gravações incluem uma proteção por hash-base para evitar a substituição de edições simultâneas.
    - As gravações (`config.set`/`config.apply`/`config.patch`) verificam previamente a resolução de SecretRefs ativos para as referências no conteúdo de configuração enviado; referências ativas enviadas que não possam ser resolvidas são rejeitadas antes da gravação.
    - Ao salvar, os formulários descartam placeholders ocultos obsoletos que não podem ser restaurados a partir da configuração salva, preservando os valores ocultos que ainda correspondem a segredos salvos.
    - O esquema e a renderização do formulário vêm de `config.schema` / `config.schema.lookup`, incluindo `title`/`description` dos campos, dicas de interface correspondentes, resumos dos filhos imediatos, metadados da documentação em nós aninhados de objeto/coringa/array/composição, além dos esquemas de plugins e canais quando disponíveis. O editor de JSON bruto só está disponível quando o snapshot permite uma conversão de ida e volta segura no formato bruto; caso contrário, a Control UI força o modo Formulário.
    - A opção "Redefinir para o salvo" do editor de JSON bruto preserva a estrutura criada no formato bruto (formatação, comentários, disposição de `$include`) em vez de renderizar novamente um snapshot nivelado, para que edições externas sobrevivam a uma redefinição quando o snapshot permitir uma conversão de ida e volta segura.
    - Valores estruturados de objeto SecretRef são renderizados como somente leitura nas entradas de texto do formulário, para evitar a conversão acidental e corrompida de objeto em string.

  </Accordion>
  <Accordion title="Uso">
    - A análise de tokens e de custo estimado derivada das sessões permanece separada do faturamento dos provedores.
    - Os cartões de provedores chamam `usage.status` e mostram nomes de planos, períodos de cota, saldos, gastos e orçamentos em tempo real informados pelos plugins de provedores configurados.
    - Uma falha no uso de um provedor não bloqueia o painel de sessões/custos; cartões de provedores indisponíveis mostram seu próprio estado de erro.

  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: snapshots de status/integridade/modelos, log de eventos e chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui tempos de atualização/RPC da Control UI, tempos lentos de renderização de chat/configuração e registros de responsividade do navegador para quadros de animação longos ou tarefas demoradas quando o navegador disponibiliza esses tipos de entrada do PerformanceObserver.
    - Logs: acompanhamento em tempo real dos logs de arquivo do Gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git e reinicie (`update.run`) com um relatório de reinicialização; depois, consulte periodicamente `update.status` após a reconexão para verificar a versão do Gateway em execução.

  </Accordion>
  <Accordion title="Observações do painel de automações">
    - Selecionar uma linha abre uma visualização de detalhes em página inteira, com um seletor Ativa/Pausada e Executar agora no cabeçalho (executar se estiver no prazo, clonar e remover no menu); a aba Configurações edita a automação diretamente (prompt, detalhes, frequência, substituições avançadas), e a aba Histórico de execuções mostra as execuções dessa automação.
    - As automações iniciais abaixo da tabela preenchem previamente o formulário de criação com um prompt e um agendamento editáveis.
    - Para tarefas isoladas, a entrega usa por padrão o anúncio de um resumo; altere para nenhuma para execuções exclusivamente internas.
    - Os campos de canal/destino aparecem quando a opção de anúncio está selecionada.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL válida de Webhook HTTP(S).
    - Para tarefas da sessão principal, os modos de entrega por Webhook e nenhuma estão disponíveis.
    - Os controles avançados de edição incluem excluir após a execução, limpar a substituição do agente, opções de cron exato/escalonado, substituições de modelo/raciocínio do agente e seletores de entrega por melhor esforço.
    - A validação do formulário ocorre diretamente na interface, com erros por campo; valores inválidos desativam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o Webhook será enviado sem um cabeçalho de autenticação.
    - `cron.webhook` é um fallback legado e obsoleto: execute `openclaw doctor --fix` para migrar tarefas armazenadas que ainda usam `notify: true` para entrega explícita por Webhook ou de conclusão em cada tarefa.

  </Accordion>
</AccordionGroup>

## Página MCP

A página dedicada do MCP é uma visualização para operadores dos servidores MCP gerenciados pelo OpenClaw em `mcp.servers`. Ela não inicia transportes MCP por conta própria; use-a para inspecionar e editar a configuração salva e, depois, use `openclaw mcp doctor --probe` quando precisar de uma comprovação do servidor em tempo real.

Fluxo de trabalho típico:

1. Abra **MCP** na barra lateral.
2. Verifique nos cartões de resumo as quantidades total, de servidores ativados, com OAuth e com filtros.
3. Examine cada linha de servidor quanto ao transporte, ativação, autenticação, filtros, tempos limite e dicas de comandos.
4. Gerencie os servidores (adicionar, ativar/desativar, remover) na página **Plugins**, que é a única interface interativa que grava `mcp.servers`; a lista de linhas desta página contém um link para ela.
5. Edite a seção de configuração `mcp` com escopo definido para as definições de servidores, cabeçalhos, caminhos TLS/mTLS, metadados de OAuth, filtros de ferramentas e metadados de projeção do Codex.
6. Use **Salvar** para gravar a configuração ou **Salvar e publicar** quando o Gateway em execução precisar aplicar a configuração alterada.
7. Execute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` em um terminal para obter diagnósticos estáticos, comprovação em tempo real ou descarte do runtime armazenado em cache.

A página oculta valores semelhantes a URLs que contenham credenciais antes da renderização e coloca os nomes dos servidores entre aspas nos trechos de comandos, para que os comandos copiados continuem funcionando com espaços ou metacaracteres do shell. Referência completa da CLI e da configuração: [MCP](/pt-BR/cli/mcp).

## Aba Atividade

A aba Atividade fica em **Configurações › Sistema**, ao lado de Logs e Depuração. Ela é um observador efêmero e local do navegador para a atividade de ferramentas em tempo real, derivado do mesmo fluxo de eventos de ferramenta / `session.tool` do Gateway que alimenta os cartões de ferramentas do Chat. Ela não adiciona outra família de eventos, endpoint, armazenamento durável de atividades, feed de métricas ou fluxo externo de observação ao Gateway.

As entradas de Atividade mantêm apenas resumos sanitizados e prévias de saída ocultas e truncadas. Os valores dos argumentos das ferramentas não são armazenados no estado de Atividade; a interface informa que os argumentos estão ocultos e registra apenas a quantidade de campos de argumentos. A lista em memória acompanha a aba atual do navegador, sobrevive à navegação dentro da Control UI e é redefinida ao recarregar a página, trocar de sessão ou selecionar **Limpar**.

## Terminal do operador

O terminal acoplável do operador fica desativado por padrão. Para ativá-lo, defina `gateway.terminal.enabled: true` e reinicie o Gateway. O terminal exige uma conexão `operator.admin` e abre um PTY do host no workspace do agente ativo. Novas abas acompanham o agente de chat selecionado no momento.

<Warning>
O terminal é um shell irrestrito do host e herda o ambiente do processo do Gateway. Ative-o somente em implantações com operadores confiáveis. O OpenClaw recusa sessões de terminal para agentes com `sandbox.mode: "all"`; alterar um agente ativo para esse modo fecha suas sessões de terminal existentes e em andamento.
</Warning>

Use **Ctrl + crase** para alternar o painel. O layout permite o acoplamento na parte inferior e à direita, redimensiona-se de acordo com a janela de visualização do navegador e mantém várias abas de shell. Consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#gateway) para `gateway.terminal.enabled` e a substituição opcional `gateway.terminal.shell`.

As sessões sobrevivem a desconexões: recarregar a página, suspender o laptop ou uma breve falha de rede desconecta a sessão no Gateway em vez de encerrá-la, e a mesma aba do navegador se reconecta quando a conexão retorna, reproduzindo a saída recente. Sessões desconectadas são encerradas após `gateway.terminal.detachedSessionTimeoutSeconds` (padrão de 300 segundos; `0` restaura o encerramento ao desconectar). `terminal.list` mostra sessões que podem ser conectadas, `terminal.attach` assume uma delas (tomada de controle no estilo tmux), e `terminal.text` lê a saída recente de uma sessão como texto simples sem se conectar — um recurso para agentes/ferramentas.

O terminal também está disponível como um documento de tela inteira exclusivo para terminal em `/?view=terminal`. Os aplicativos para iOS e Android incorporam essa página em suas telas de Terminal, reutilizando as credenciais armazenadas do Gateway; a disponibilidade segue as mesmas restrições de `gateway.terminal.enabled` e `operator.admin`, e a página mostra um aviso quando o Gateway conectado não oferece o terminal.

## Painel do navegador

A Control UI inclui um painel acoplável de navegador que renderiza o navegador controlado pelo Gateway (o mesmo que os agentes operam por meio da [ferramenta de navegador](/pt-BR/tools/browser-control)) em qualquer navegador web comum — sem exigir uma webview nativa. Ele aparece quando o Gateway conectado anuncia `browser.request` para uma conexão `operator.admin`; o botão de globo na barra lateral do workspace da sessão o alterna. O painel mostra um snapshot em tempo real da página com abas, uma barra de URL editável, voltar/avançar/recarregar e abrir no seu navegador, pode ser acoplado à direita ou na parte inferior e encaminha cliques, rolagem pela roda e digitação básica para a página remota.

Dois modos de captura reúnem o contexto da página para o agente:

- **Anotar (lápis)**: desenhe marcações à mão livre sobre a página. **Enviar ao chat** incorpora os traços à captura de tela, anexa a imagem ao campo de composição do chat ativo e preenche previamente um prompt descrevendo a URL e o título da página, além de cada região marcada, para que o agente saiba exatamente o que você circulou.
- **Inspecionar (ponteiro)**: passe o cursor para ver o elemento sob ele (seletor, nome acessível, função, tamanho); clique para enviar os detalhes desse elemento e uma captura de tela com destaque pelo mesmo fluxo do campo de composição. A inspeção, a rolagem com a roda e a navegação para trás/para frente exigem `browser.evaluateEnabled` (ativado por padrão).

O aplicativo para macOS mantém sua barra lateral nativa de navegação de links para os links clicados no painel; o painel do navegador também funciona nela e é a forma de anotar páginas em todas as outras plataformas.

## Comportamento do chat

  <AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }`, e a resposta é transmitida por eventos `chat`. Clientes confiáveis da Control UI também podem receber metadados opcionais de temporização da confirmação para diagnóstico local.
    - Os uploads no chat aceitam imagens e arquivos que não sejam vídeos. As imagens mantêm o caminho de imagem nativo; os demais arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexos.
    - Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` durante a execução e `{ status: "ok" }` após a conclusão.
    - As respostas de `chat.history` têm tamanho limitado para a segurança da interface. Quando as entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um espaço reservado (`[chat.history omitted: message too large]`).
    - Quando uma mensagem visível do assistente foi truncada em `chat.history`, o leitor lateral pode buscar sob demanda a entrada completa da transcrição normalizada para exibição por meio de `chat.message.get`, usando `sessionKey`, o `agentId` ativo quando necessário e o `messageId` da transcrição. Se o Gateway ainda não puder retornar mais conteúdo, o leitor mostrará um estado explicitamente indisponível em vez de repetir silenciosamente a prévia truncada.
    - Imagens geradas ou fornecidas pelo assistente são mantidas como referências de mídia gerenciada e disponibilizadas novamente por URLs de mídia autenticadas do Gateway, para que os recarregamentos não dependam da permanência de cargas úteis de imagem base64 brutas na resposta do histórico do chat.
    - Ao renderizar `chat.history`, a Control UI remove do texto visível do assistente as tags de diretivas em linha usadas somente para exibição (por exemplo, `[[reply_to_*]]` e `[[audio_as_voice]]`), as cargas úteis XML de chamadas de ferramentas em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramentas) e tokens de controle do modelo em ASCII ou largura completa que tenham vazado. Ela omite entradas do assistente cujo texto visível inteiro contenha apenas o token silencioso exato `NO_REPLY` / `no_reply` ou o token de confirmação de Heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém visíveis as mensagens locais otimistas do usuário e do assistente se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais assim que o histórico do Gateway é atualizado.
    - Os eventos `chat` em tempo real representam o estado da entrega, enquanto `chat.history` é reconstruído a partir da transcrição persistente da sessão. Após eventos finais de ferramentas, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição está documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` acrescenta uma observação do assistente à transcrição da sessão e transmite um evento `chat` para atualizações somente da interface, sem execução do agente nem entrega ao canal.
    - A barra lateral lista todas as sessões ativas carregadas, organizadas por seção de agente e pelos grupos fixadas/canal/trabalho/personalizadas/Chats, com uma única ação Nova sessão que abre a caixa de diálogo de rascunho. Abrir uma linha visível apenas move o destaque. Grupos personalizados podem ser recolhidos e reordenados por arrastar, e as sessões podem ser soltas em um grupo ou em Chats; os nomes e a ordem dos grupos são sincronizados pelo Gateway, enquanto o estado recolhido permanece no navegador. Uma nova sessão do painel recebe de forma assíncrona um título conciso gerado a partir de sua primeira mensagem que não seja um comando; nomes explícitos nunca são substituídos. Defina `agents.defaults.utilityModel` (ou `agents.list[].utilityModel`) para encaminhar essa chamada de modelo separada a um modelo de menor custo. Expandir a seção de outro agente permite navegar pelas sessões desse agente sem sair do chat aberto.
    - A pesquisa de sessões fica na paleta de comandos (⌘K ou o campo Pesquisar na parte superior da barra lateral): ao digitar uma consulta, ela percorre um número limitado de páginas correspondentes entre os agentes, filtra linhas internas de sessões filhas/Cron e lista as correspondências visíveis ao lado dos comandos de navegação. A página Sessões mantém a lista completa e pesquisável com filtros.
    - Cada linha da barra lateral mantém acesso direto à fixação e um menu de contexto completo para estado de não lida, renomeação, bifurcação, agrupamento, arquivamento e exclusão. Linhas selecionadas em conjunto (Cmd/Ctrl-clique, Shift-clique para intervalos) recebem um menu em lote que abrange estado de não lida, agrupamento, arquivamento e exclusão; o arquivamento e a exclusão em lote permanecem desativados, a menos que todas as sessões selecionadas possam ser arquivadas. Uma execução ativa e a sessão principal de um agente não podem ser arquivadas. Arquivar ou excluir a sessão atualmente selecionada faz o Chat voltar à sessão principal desse agente.
    - No aplicativo para macOS, a marca do OpenClaw usa a faixa nativa da barra de título que normalmente fica vazia, ao lado dos controles da janela, em vez de ocupar uma linha da barra lateral.
    - Em larguras de desktop, os controles do chat permanecem em uma única linha compacta e são recolhidos ao rolar a transcrição para baixo; rolar para cima, voltar ao topo ou chegar ao fim restaura os controles.
    - Mensagens consecutivas duplicadas contendo apenas texto são renderizadas como um único balão com um indicador de quantidade. Mensagens que contêm imagens, anexos, saída de ferramentas ou prévias do Canvas não são agrupadas.
    - Quando o checkout de uma sessão está em uma branch não padrão de um repositório do GitHub, a visualização do chat fixa indicadores de pull requests acima do compositor: número da PR, repositório, branch, contagens do diff, um indicador de CI e estado de rascunho/mesclada/fechada, cada um com link para a PR. A linha mostra no máximo dois indicadores — primeiro as PRs ativas (abertas/em rascunho) —, e um botão "Mostrar mais" revela o histórico recolhido de PRs mescladas/fechadas. O indicador de CI abre um pequeno popover de monitoramento da CI com contagens de verificações aprovadas/com falha/em execução/ignoradas e um link para a página de verificações da PR. A detecção é executada no servidor por meio de `controlUi.sessionPullRequests`, que reutiliza `GH_TOKEN`/`GITHUB_TOKEN` do Gateway quando definidos. Quando o limite de taxa da API do GitHub é atingido, os indicadores mantêm o último estado conhecido e mostram um aviso de que o estado pode estar desatualizado; dispensar um indicador o oculta para essa sessão no perfil atual do navegador. Antes de existir qualquer PR, a linha mostra a própria branch — repositório, nome da branch e tamanho +/− do diff em relação à base de mesclagem da branch padrão (trabalho confirmado e não confirmado) — com um botão Criar PR que abre a página de novo pull request do GitHub. A linha aparece assim que a branch enviada tem commits para comparar e se oculta enquanto existe uma PR aberta ou em rascunho. A linha da branch usa apenas o git local, portanto continua disponível enquanto o GitHub está com limitação de taxa e exibe o mesmo aviso de estado desatualizado, pois não é possível confiar em "nenhuma PR encontrada" até que o limite seja redefinido.
    - O painel de diff da sessão mostra o que o checkout de uma sessão realmente alterou: o botão da branch (no cabeçalho da área lateral do espaço de trabalho, no cabeçalho do painel dividido ou no botão flutuante do chat em painel único) abre o painel de detalhes com um diff por arquivo do trabalho da branch, não confirmado e não rastreado em relação à base de mesclagem da branch padrão do checkout — ponto de estado, seta de renomeação, contagens +/− por arquivo, arquivos recolhíveis e marcadores de "N linhas não modificadas" entre trechos. Os diffs são calculados no servidor pelo método `sessions.diff` do Gateway (escopo `operator.read`); arquivos binários e grandes demais são reduzidos a entradas contendo apenas estatísticas, e o botão aparece somente quando o Gateway conectado anuncia `sessions.diff`.
    - A área lateral do espaço de trabalho da sessão em cada painel do Chat lista arquivos da sessão, arquivos do projeto e artefatos. Por padrão, ela fica encaixada na borda direita do painel; arraste seu cabeçalho (ou use o botão de encaixe) para movê-la para a parte inferior, e a escolha será armazenada no perfil atual do navegador. Uma área lateral recolhida não ocupa espaço algum: reabra-a com ⇧⌘B, o alternador de arquivos no cabeçalho do painel dividido ou o botão flutuante de arquivos no chat em painel único (ambos exibem um indicador da quantidade de arquivos alterados). O painel separado de detalhes de arquivos, ferramentas e Canvas não é afetado.
    - Clicar em uma referência de arquivo no chat, em um caminho de arquivo em um cartão expandido de ferramenta de leitura/edição/gravação ou em uma linha de arquivo na área lateral do espaço de trabalho abre o painel de detalhes do arquivo: uma visualização de código baseada no CodeMirror, com realce de sintaxe, números de linha, salto para linha, pesquisa no arquivo, ações de cópia e um menu para abrir em um editor externo. Quando o Gateway anuncia `sessions.files.set` para uma conexão `operator.admin`, o painel adiciona um modo Editar com acompanhamento de alterações não salvas e salvamento por Cmd/Ctrl-S; rascunhos não salvos persistem durante a navegação entre arquivos, painéis e sessões na aba atual do navegador até serem explicitamente salvos ou descartados. Os salvamentos usam comparação e troca com base em um hash do conteúdo retornado por `sessions.files.get`: se o arquivo tiver sido alterado no disco desde que foi carregado (por exemplo, porque o agente continuou trabalhando), o painel mostrará um aviso de conflito com as ações Recarregar (usar o conteúdo mais recente) e Sobrescrever (manter a edição local). As gravações passam pelas mesmas proteções de segurança do sistema de arquivos do espaço de trabalho usadas nas leituras — contenção de caminho, rejeição de links simbólicos/físicos e limite de 256 KB em UTF-8 — e apenas sobrescrevem arquivos existentes; o editor nunca os cria nem exclui.
    - A área lateral de tarefas em segundo plano em cada painel do Chat lista as tarefas em segundo plano e os subagentes do agente atual (`tasks.list` com escopo por agente, mantido atualizado por eventos `task`): o trabalho em execução mostra um cronômetro decorrido em tempo real, a contagem de usos de ferramentas, a ferramenta atualmente em uso e um controle de interrupção; a seção recolhível de tarefas concluídas adiciona as durações das execuções; e um link Ver transcrição abre a sessão filha da tarefa no painel. Abra-a com o alternador de atividade no cabeçalho do painel dividido ou com o botão flutuante de atividade no chat em painel único — o snapshot das tarefas é carregado antecipadamente, portanto ambos exibem um indicador da quantidade em execução sem que seja necessário abrir primeiro a área lateral. A página Tarefas continua sendo o registro completo entre agentes.
    - A área lateral do espaço de trabalho, a área lateral de tarefas em segundo plano e o painel de detalhes se adaptam à largura de cada painel, e não à da janela: em um painel estreito ou uma janela compacta, ambas as áreas laterais são exibidas como faixas inferiores (os controles de encaixe lateral ficam ocultos até que o painel fique mais largo; a área lateral do espaço de trabalho tem prioridade sobre o espaço lateral quando cabe apenas uma coluna), e o painel de detalhes é empilhado abaixo da conversa, com uma alça de redimensionamento horizontal, em vez de compartilhar a mesma linha. Em áreas de visualização do tamanho de um celular, o painel de detalhes ainda é aberto em tela cheia.
    - Os seletores de modelo e raciocínio do cabeçalho do chat atualizam imediatamente a sessão ativa por meio de `sessions.patch`; eles são substituições persistentes da sessão, não opções de envio válidas para apenas um turno.
    - **Visualização dividida:** abra-a pela linha de alternadores flutuantes no canto superior direito (ao lado dos alternadores de diff da sessão, tarefas em segundo plano e arquivos da sessão) e divida o painel ativo para a direita ou para baixo em quantos painéis couberem. Cada painel tem sua própria sessão, transcrição, compositor e fluxo de ferramentas.
    - Arraste uma sessão da barra lateral para o chat para abri-la em um painel. Uma prévia animada do destino desliza entre as zonas e identifica o resultado — "Dividir" sobre a metade exata que um novo painel ocupará, "Abrir aqui" sobre um painel inteiro —, e também é possível soltar no modo de painel único.
    - O painel dividido ativo determina a seleção da barra lateral e a URL. Cada painel tem sua própria linha de cabeçalho com o título da sessão e controles da área lateral do espaço de trabalho, divisão e fechamento; os divisores redimensionam colunas e painéis empilhados, e o navegador armazena o layout localmente entre recarregamentos.
    - Em telas estreitas, a visualização dividida mantém o layout, mas renderiza somente o painel ativo, incluindo seu cabeçalho com o controle de fechamento.
    - Se você enviar uma mensagem enquanto uma alteração no seletor de modelo da mesma sessão ainda estiver sendo salva, o compositor aguardará a atualização dessa sessão antes de chamar `chat.send`, garantindo que o envio use o modelo selecionado.
    - Digitar `/new` cria e muda para a mesma nova sessão do painel que Novo chat, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, ele redefine a sessão principal no local. Digitar `/reset` mantém a redefinição explícita no local do Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada no Gateway. Se `agents.defaults.models` estiver presente, essa lista de permissões determinará o seletor, incluindo entradas `provider/*` que mantêm dinâmicos os catálogos com escopo por provedor. Caso contrário, o seletor mostrará entradas `models.providers.*.models` explícitas e provedores com autenticação utilizável. O catálogo completo continua disponível pelo RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios recentes de uso da sessão do Gateway incluem os tokens de contexto atuais, a barra de ferramentas do compositor de chat exibe um pequeno anel de uso do contexto com a porcentagem utilizada. Abra o anel para ver a janela de contexto atual, as contagens de tokens da execução mais recente e o custo total estimado, a identificação do provedor/modelo e, quando informado, o detalhamento de custos de entrada/saída/cache da resposta mais recente do provedor. O anel muda para o estilo de alerta quando há alta pressão sobre o contexto e, nos níveis recomendados de Compaction, exibe um botão compacto que executa o fluxo normal de Compaction da sessão. Instantâneos de tokens desatualizados ficam ocultos até que o Gateway informe novamente dados de uso recentes.

  </Accordion>
  <Accordion title="Modo de conversa (tempo real no navegador)">
    O modo de conversa usa um provedor de voz em tempo real registrado. Configure a OpenAI com `talk.realtime.provider: "openai"` mais um perfil de chave de API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY`. O OpenAI Realtime usa a API pública da Platform e exige uma chave de API da Platform; um login OAuth do Codex não atende a essa interface. Configure o Google com `talk.realtime.provider: "google"` mais `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API padrão do provedor: a OpenAI recebe um segredo efêmero de cliente do Realtime para WebRTC, e o Google Live recebe um token de autenticação restrito e de uso único da Live API para uma sessão WebSocket do navegador, com instruções e declarações de ferramentas bloqueadas no token pelo Gateway. Provedores que oferecem apenas uma ponte de tempo real no backend são executados pelo transporte de retransmissão do Gateway, de modo que as credenciais e os sockets do fornecedor permanecem no lado do servidor enquanto o áudio do navegador trafega por RPCs autenticadas do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instruções fornecidas pelo chamador.

    Os padrões persistentes de provedor, modelo, voz, transporte, esforço de raciocínio, limite exato de VAD, duração do silêncio e preenchimento do prefixo ficam em **Settings → Communications → Talk**; alterá-los exige acesso `operator.admin`. Configurar a retransmissão do Gateway força o caminho de retransmissão pelo backend; configurar WebRTC mantém a sessão sob controle do cliente e falha, em vez de recorrer silenciosamente à retransmissão, se o provedor não puder criar uma sessão no navegador.

    O próprio controle de conversa é o botão de microfone na barra de ferramentas do compositor. O menu desse botão lista **System default** e todos os microfones disponibilizados pelo navegador, incluindo entradas USB, Bluetooth e virtuais. O ID do dispositivo selecionado permanece local no navegador e nunca é enviado ao Gateway; se esse dispositivo exato desaparecer, o modo de conversa solicitará que você escolha outra entrada, em vez de gravar silenciosamente com outro microfone. Enquanto o modo de conversa estiver ativo, o botão do microfone se transformará em um botão em formato de cápsula que exibe o medidor do nível de entrada em tempo real; clicar nele interrompe a entrada de voz, e passar o cursor sobre ele revela o glifo de interrupção. Os leitores de tela anunciam `Connecting voice input...`, `Listening...` ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por meio de `talk.client.toolCall`. Interromper uma resposta em execução do agente continua sendo uma ação separada no controle quadrado **Stop**, ao lado da cápsula.

    Teste rápido ao vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a ponte WebSocket do backend da OpenAI, a troca de SDP WebRTC no navegador da OpenAI, a configuração do WebSocket do Google Live no navegador com token restrito e o adaptador de retransmissão do Gateway para navegador com mídia de microfone simulada. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Interromper e abortar">
    - Clique em **Stop** (chama `chat.abort`).
    - Enquanto uma execução estiver ativa, os acompanhamentos normais entram na fila. Clique em **Steer** em uma mensagem na fila para injetar esse acompanhamento no turno em execução.
    - Digite `/stop` (ou frases de cancelamento isoladas, como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial após aborto">
    - Quando uma execução é abortada, o texto parcial do assistente ainda pode ser exibido na interface.
    - O Gateway persiste no histórico da transcrição o texto parcial abortado do assistente quando há saída no buffer.
    - As entradas persistidas incluem metadados de aborto para que os consumidores da transcrição possam distinguir resultados parciais abortados da saída de uma conclusão normal.

  </Accordion>
</AccordionGroup>

## Perda de conexão e reconexão

Depois que uma sessão é estabelecida, a queda da conexão com o Gateway não encerra sua sessão. O painel
permanece visível com uma cápsula âmbar flutuante "Gateway connection lost — Reconnecting…" abaixo da barra
superior enquanto o cliente tenta se reconectar automaticamente com espera progressiva (de 800 ms até 15 s). As atualizações ao vivo e
as ações de tempo real/sessão ficam pausadas até a conexão retornar; **Retry now** na cápsula força uma
tentativa imediata. O chat continua editável: envios comuns de texto e anexos são mantidos no armazenamento do navegador
da guia atual, com escopo de Gateway/sessão, exibidos como aguardando a reconexão e enviados
automaticamente quando o Gateway retorna. Controles ao vivo e comandos de barra continuam indisponíveis enquanto
estiver offline.

Quando este navegador já tem credenciais (um token/senha configurado ou um token de dispositivo
aprovado), a primeira abertura e os recarregamentos exibem uma pequena marca animada do OpenClaw enquanto a conexão é
estabelecida, em vez de mostrar brevemente a tela de login. A tela de login só aparece quando ainda não há credenciais
armazenadas ou quando o Gateway as rejeita ativamente (token/senha incorreto, pareamento revogado) —
estados que exigem sua intervenção, em vez de espera.

## Instalação da PWA e Web Push

A interface de controle inclui um `manifest.webmanifest` e um service worker, portanto navegadores modernos podem instalá-la como uma PWA independente. O Web Push permite que o Gateway desperte a PWA instalada com notificações mesmo quando a guia ou a janela do navegador não está aberta.

Se a página exibir **Protocol mismatch** logo após uma atualização do OpenClaw, primeiro reabra o painel com `openclaw dashboard` e faça uma atualização forçada. Se ainda houver falha, limpe os dados do site da origem do painel ou teste em uma janela privada do navegador; uma guia antiga ou o cache do service worker do navegador pode continuar executando um pacote da interface de controle anterior à atualização com o Gateway mais recente.

| Interface                                             | O que faz                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto da PWA. Os navegadores oferecem "Install app" quando ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que trata eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (no diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente, usado para assinar cargas do Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints persistidos das assinaturas do navegador.                |

Substitua o par de chaves VAPID por meio de variáveis de ambiente no processo do Gateway quando quiser fixar as chaves (implantações em vários hosts, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `https://openclaw.ai`)

A interface de controle usa estes métodos do Gateway com escopo restrito para registrar e testar assinaturas do navegador:

- `push.web.vapidPublicKey` obtém a chave pública VAPID ativa.
- `push.web.subscribe` registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` remove um endpoint registrado.
- `push.web.test` envia uma notificação de teste para a assinatura do chamador.

<Note>
O Web Push é independente do caminho de retransmissão APNS do iOS (consulte [Configuração](/pt-BR/gateway/configuration) para notificações push baseadas em retransmissão) e do método `push.test`, que tem como destino o pareamento nativo de dispositivos móveis.
</Note>

## Incorporações hospedadas

As mensagens do assistente podem renderizar conteúdo web hospedado em linha com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

O Plugin Canvas incluído também fornece [`show_widget`](/pt-BR/tools/show-widget) para renderizar SVG ou HTML autocontido diretamente de uma chamada de ferramenta. O navegador anuncia o recurso `inline-widgets` do Gateway, e o documento Canvas resultante permanece disponível quando o histórico do chat é recarregado. Execuções originadas em canais não recebem essa ferramenta.

<Tabs>
  <Tab title="strict">
    Desativa a execução de scripts dentro de incorporações hospedadas.
  </Tab>
  <Tab title="scripts (padrão)">
    Permite incorporações interativas enquanto mantém o isolamento da origem; geralmente é suficiente para jogos/widgets autocontidos no navegador.
  </Tab>
  <Tab title="trusted">
    Adiciona `allow-same-origin` além de `allow-scripts` para documentos do mesmo site que precisam intencionalmente de privilégios mais elevados.
  </Tab>
</Tabs>

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
Use `trusted` somente quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos e canvases interativos gerados por agentes, `scripts` é a opção mais segura.
</Warning>

URLs absolutas externas de incorporação `http(s)` permanecem bloqueadas por padrão. Para permitir que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura das mensagens do chat

A transcrição do chat usa uma área legível centralizada e alinhada ao campo de composição. As saídas do assistente e das ferramentas permanecem alinhadas à esquerda, enquanto os balões do usuário permanecem alinhados à direita dentro dessa área. Implantações em monitores largos podem substituir a largura da transcrição sem modificar o CSS incluído, definindo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

O valor é validado antes de chegar ao navegador. Os formatos compatíveis incluem comprimentos simples e porcentagens, como `960px` ou `82%`, além de expressões de largura restritas com `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Acesso à tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferencial)">
    Mantenha o Gateway no loopback e deixe o Tailscale Serve atuar como proxy com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado).

    Por padrão, as solicitações do Serve da interface de controle/WebSocket podem se autenticar por meio dos cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o com o cabeçalho, e só aceita essas solicitações quando elas chegam ao endereço de loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da interface de controle com identidade de dispositivo do navegador, esse caminho verificado do Serve também ignora a etapa de pareamento do dispositivo; navegadores sem dispositivo e conexões com função de Node ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para o tráfego do Serve e, em seguida, use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade do Serve, as tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações do limite de taxa. Portanto, novas tentativas inválidas simultâneas do mesmo navegador podem exibir `retry later` na segunda solicitação, em vez de duas incompatibilidades simples disputando em paralelo.

    <Warning>
    A autenticação do Serve sem token pressupõe que o host do Gateway seja confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular à tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Abra `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` configurado).

    Cole o segredo compartilhado correspondente nas configurações da interface (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP não seguro

Se você abrir o painel por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador será executado em um **contexto não seguro** e bloqueará a WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da interface de controle sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade com HTTP não seguro somente para localhost usando `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida de operador da interface de controle por meio de `gateway.auth.mode: "trusted-proxy"`
- opção emergencial `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a interface localmente em `https://<magicdns>/` (Serve) ou `http://127.0.0.1:18789/` (no host do Gateway).

<AccordionGroup>
  <Accordion title="Comportamento da opção de autenticação insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` é apenas uma opção de compatibilidade local:

    - Ela permite que sessões locais da Control UI prossigam sem identidade do dispositivo em contextos HTTP não seguros.
    - Ela não ignora as verificações de pareamento.
    - Ela não flexibiliza os requisitos de identidade do dispositivo para acesso remoto (fora do localhost).

  </Accordion>
  <Accordion title="Somente para emergências">
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
    `dangerouslyDisableDeviceAuth` desativa as verificações de identidade do dispositivo da Control UI e reduz gravemente a segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Observação sobre proxy confiável">
    - Uma autenticação bem-sucedida por proxy confiável pode admitir sessões de **operador** da Control UI sem identidade do dispositivo.
    - Isso **não** se estende a sessões da Control UI com função de Node.
    - Proxies reversos de loopback no mesmo host ainda não atendem aos requisitos da autenticação por proxy confiável; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para obter orientações sobre a configuração de HTTPS.

## Política de segurança de conteúdo

A Control UI inclui uma política `img-src` restrita: somente recursos da **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagens remotas `http(s)` e relativas ao protocolo são rejeitadas pelo navegador e nunca geram solicitações de rede.

Na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) continuam sendo renderizados, incluindo rotas de avatar autenticadas que a interface busca e converte em URLs `blob:` locais.
- URLs `data:image/...` embutidas continuam sendo renderizadas.
- URLs `blob:` locais criadas pela Control UI continuam sendo renderizadas.
- Os avatares das prévias de links do GitHub são buscados pelo Gateway no host fixo de avatares do GitHub e retornados como URLs `data:` de tamanho limitado; o navegador do operador nunca entra em contato com o host remoto de avatares.
- URLs remotas de avatar emitidas pelos metadados do canal são removidas pelos auxiliares de avatar da Control UI e substituídas pelo logotipo/selo integrado, de modo que um canal comprometido ou malicioso não possa forçar buscas arbitrárias de imagens remotas pelo navegador de um operador.

Esse recurso está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do Gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do Gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente para clientes autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (como ocorre na rota relacionada de mídia do assistente), portanto, a rota de avatar não pode expor a identidade do agente em hosts que, de outra forma, estejam protegidos.
- A Control UI encaminha o token do Gateway como um cabeçalho bearer ao buscar avatares e usa URLs de blob autenticadas para que a imagem continue sendo renderizada nos painéis.

Se você desativar a autenticação do Gateway (não recomendado em hosts compartilhados), a rota de avatar também ficará sem autenticação, em conformidade com o restante do Gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do Gateway está configurada, as prévias de mídia local do assistente usam uma rota em duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da Control UI; o navegador envia o token do Gateway como um cabeçalho bearer ao verificar a disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração, limitado ao caminho de origem exato.
- URLs de imagens, áudios, vídeos e documentos renderizados pelo navegador usam `mediaTicket=<ticket>` em vez do token ou da senha ativa do Gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

Isso mantém a renderização de mídia compatível com elementos de mídia nativos do navegador sem incluir credenciais reutilizáveis do Gateway em URLs de mídia visíveis.

## Links de aprovação

As notificações de aprovação do operador podem incluir links diretos para um documento de aprovação independente servido no namespace reservado `${controlUiBasePath}/approve/{approvalId}` (por exemplo, `/approve/<approvalId>` ou `/openclaw/approve/<approvalId>` com um caminho base configurado). A URL permanece estável durante toda a vigência da aprovação e pode ser encaminhada com segurança entre seus próprios dispositivos: ela identifica a aprovação, mas nunca a autoriza.

- O namespace de um segmento `/approve/<approvalId>` é reservado pelo Gateway antes das rotas HTTP de plugins para **todos** os métodos HTTP, portanto, uma rota de Plugin nunca pode sobrepor nem interceptar um documento de aprovação.
- A abertura de um documento de aprovação exige a mesma autenticação do Gateway que o restante da Control UI (token/senha, identidade do Tailscale Serve ou identidade de proxy confiável); as credenciais nunca fazem parte da URL de aprovação.
- Quando o serviço da Control UI está desativado, as solicitações ao namespace retornam `404` em vez de serem encaminhadas aos manipuladores de plugins.
- O login em um documento de aprovação é temporário para essa página: ele não substitui a seleção nem as configurações do Gateway salvas pela Control UI completa no mesmo navegador.

O Gateway serve arquivos estáticos de `dist/control-ui`:

```bash
pnpm ui:build
```

Base absoluta opcional (URLs fixas de recursos):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Em seguida, aponte a interface para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Página em branco da Control UI

Se o navegador carregar um painel em branco e o DevTools não mostrar nenhum erro útil, uma extensão ou um script de conteúdo executado antecipadamente pode ter impedido a avaliação do aplicativo de módulo JavaScript. A página estática inclui um painel de recuperação em HTML simples que aparece quando `<openclaw-app>` não é registrado após a inicialização.

Use a ação **Tentar novamente** do painel após alterar o ambiente do navegador ou recarregue manualmente depois destas verificações:

- Desative extensões que injetam conteúdo em todas as páginas, especialmente extensões com scripts de conteúdo `<all_urls>`.
- Experimente uma janela privada, um perfil de navegador limpo ou outro navegador.
- Mantenha o Gateway em execução e verifique a mesma URL do painel após trocar de navegador.

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Control UI consiste em arquivos estáticos; o destino do WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você deseja executar o servidor de desenvolvimento do Vite localmente, mas o Gateway está em outro local.

<Steps>
  <Step title="Inicie o servidor de desenvolvimento da interface">
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
    - `gatewayUrl` é armazenado no localStorage após o carregamento e removido da URL.
    - Se você fornecer um endpoint `ws://` ou `wss://` completo por meio de `gatewayUrl`, codifique o valor para URL para que o navegador analise a string de consulta corretamente.
    - Sempre que possível, `token` deve ser fornecido pelo fragmento da URL (`#token=...`). Fragmentos não são enviados ao servidor, o que evita vazamentos em logs de solicitações e no Referer. Parâmetros de consulta legados `?token=` ainda são importados uma única vez para fins de compatibilidade, mas apenas como fallback, e são removidos imediatamente após a inicialização.
    - `password` é mantido somente na memória.
    - Quando `gatewayUrl` está definido, a interface não recorre a credenciais de configuração ou de ambiente. Forneça `token` (ou `password`) explicitamente; a ausência de credenciais explícitas é um erro.
    - Use `wss://` quando o Gateway estiver protegido por TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada), para evitar clickjacking.
    - Implantações públicas da Control UI fora do loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Carregamentos privados de mesma origem em LAN/Tailnet provenientes de hosts de loopback, RFC1918/link-local, `.local`, `.ts.net` ou Tailscale CGNAT são aceitos sem ativar o fallback do cabeçalho Host.
    - A inicialização do Gateway pode preencher origens locais, como `http://localhost:<port>` e `http://127.0.0.1:<port>`, com base no endereço e na porta efetivos de vinculação em tempo de execução, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]`, exceto para testes locais rigidamente controlados; isso significa permitir qualquer origem de navegador, não "corresponder ao host que estou usando".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa o modo de fallback de origem pelo cabeçalho Host, mas esse é um modo de segurança perigoso.

  </Accordion>
</AccordionGroup>

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

- [Painel](/pt-BR/web/dashboard) — painel do Gateway
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento da integridade do Gateway
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
