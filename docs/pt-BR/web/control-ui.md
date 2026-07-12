---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada em navegador para o Gateway (chat, atividade, nodes, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-07-12T15:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5e9902cd8c2b7af0f47eaeec73cf365dd0f3963900b28880d4150939a1f447a2
    source_path: web/control-ui.md
    workflow: 16
---

A Interface de Controle é um pequeno aplicativo de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/)).

Se a página não carregar, primeiro inicie o Gateway: `openclaw gateway`.

<Note>
Em associações de LAN nativas do Windows, o Firewall do Windows ou uma Política de Grupo gerenciada pela organização ainda pode bloquear a URL da LAN anunciada, mesmo quando `127.0.0.1` funciona no host do Gateway. Execute `openclaw gateway status --deep` no host Windows; o comando informa portas provavelmente bloqueadas, incompatibilidades de perfil e regras locais de firewall que a política pode ignorar.
</Note>

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações mantém um token para a sessão da aba atual do navegador e a URL do gateway selecionado; as senhas não são persistidas. A integração inicial geralmente gera um token do gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

A conexão por um novo navegador ou dispositivo geralmente exige uma **aprovação de pareamento única**, exibida como `disconnected (1008): pairing required`.

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

Alterar um navegador já pareado do acesso de leitura para o acesso de gravação/administrador é tratado como uma elevação de aprovação, não como uma reconexão silenciosa: o OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais abrangente e solicita que você aprove explicitamente o novo conjunto de escopos.

Depois da aprovação, o dispositivo é lembrado e não exige uma nova aprovação, a menos que você a revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte a [CLI de dispositivos](/pt-BR/cli/devices) para informações sobre rotação de tokens, revogação e o fluxo de aprovação da primeira execução do Paperclip / `openclaw_gateway`.

<Note>
- Conexões diretas do navegador pelo loopback local (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode ignorar a etapa de pareamento para sessões de operador da Interface de Controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo. Navegadores sem identidade de dispositivo e conexões com função de Node ainda seguem as verificações normais de dispositivo.
- Associações diretas à Tailnet, conexões do navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo exclusivo; portanto, trocar de navegador ou limpar os dados do navegador exige um novo pareamento.

</Note>

## Parear um dispositivo móvel

Um administrador já pareado pode criar o QR de conexão do iOS/Android sem abrir um terminal:

<Steps>
  <Step title="Abrir o pareamento móvel">
    Selecione **Dispositivos** e clique em **Parear dispositivo móvel** no cartão **Dispositivos**.
  </Step>
  <Step title="Conectar o telefone">
    No aplicativo móvel OpenClaw, abra **Configurações** → **Gateway** e escaneie o código QR. Como alternativa, você pode copiar e colar o código de configuração.
  </Step>
  <Step title="Confirmar a conexão">
    O aplicativo oficial para iOS/Android conecta-se automaticamente. Se **Aprovação pendente** exibir uma solicitação, revise a função e os escopos antes de aprová-la.
  </Step>
</Steps>

A criação de um código de configuração exige `operator.admin`; o botão fica desabilitado em sessões sem esse escopo. Um código de configuração contém uma credencial de inicialização de curta duração; portanto, trate o QR e o código copiado como uma senha enquanto forem válidos. Para o pareamento remoto, o Gateway deve ser resolvido como `wss://` (por exemplo, por meio do Tailscale Serve/Funnel); `ws://` simples é limitado ao loopback e a endereços de LAN privada. Consulte [Pareamento](/pt-BR/channels/pairing#pair-from-the-control-ui-recommended) para obter todos os detalhes de segurança e fallback.

## Identidade pessoal (local do navegador)

A Interface de Controle é compatível com uma identidade pessoal por navegador (nome de exibição e avatar), anexada às mensagens enviadas para atribuição em sessões compartilhadas. Ela reside no armazenamento do navegador, com escopo limitado ao perfil atual do navegador, e não é sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais de autoria da transcrição nas mensagens enviadas. Limpar os dados do site ou trocar de navegador redefine a identidade como vazia.

A substituição do avatar do assistente segue o mesmo padrão local do navegador: as substituições carregadas sobrepõem localmente a identidade resolvida pelo gateway e nunca fazem uma viagem de ida e volta por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` continua disponível para clientes que não usam a interface e gravam diretamente no campo.

## Endpoint de configuração de runtime

A Interface de Controle busca suas configurações de runtime em `/control-ui-config.json`, resolvido em relação ao caminho base da Interface de Controle do gateway (por exemplo, `/__openclaw__/control-ui-config.json` sob o caminho base `/__openclaw__/`). Esse endpoint é protegido pela mesma autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não podem acessá-lo, e uma busca bem-sucedida exige um token/senha válido do gateway, uma identidade do Tailscale Serve ou uma identidade de proxy confiável.

## Status do host do Gateway

Abra **Configurações** na visualização Simples para ver o cartão **Host do Gateway**, com a máquina do Gateway, o endereço da LAN, o sistema operacional, o runtime, o tempo de atividade, a carga da CPU, a memória e o espaço em disco do volume de estado. Enquanto estiver visível, o cartão é atualizado a cada 10 segundos por meio do RPC `system.info` do Gateway, que exige o escopo `operator.read`. Gateways mais antigos e conexões sem esse escopo omitem o cartão.

## Suporte a idiomas

A Interface de Controle é localizada na primeira inicialização com base na localidade do navegador. Para substituí-la posteriormente, abra **Configurações -> Geral -> Idioma** (o seletor fica no cartão de configurações rápidas Geral, não em Aparência).

- Localidades compatíveis: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- As traduções para outros idiomas além do inglês são carregadas de forma adiada no navegador.
- A localidade selecionada é salva no armazenamento do navegador e reutilizada em visitas futuras.
- Chaves de tradução ausentes usam o inglês como fallback.

As traduções da documentação são geradas para o mesmo conjunto de localidades diferentes do inglês, mas o seletor de idiomas integrado do site de documentação do Mintlify lista apenas os códigos de localidade aceitos pelo Mintlify. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify aceite esses códigos.

## Temas de aparência

O painel Aparência inclui os temas integrados Claw, Knot e Dash (Claw é o padrão), além de um slot de importação do tweakcn local do navegador. Para importar um tema, abra o [editor do tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Share** e cole o link copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs do editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs brutos de tema e nomes de temas padrão, como `amethyst-haze`.

Os temas importados são armazenados somente no perfil atual do navegador; eles não são gravados na configuração do gateway nem sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo retorna ao Claw se o tema importado estiver ativo.

Aparência também inclui uma configuração local do navegador de Tamanho do texto, armazenada com o restante das preferências da Interface de Controle. Ela é aplicada ao texto do chat, ao texto do compositor, aos cartões de ferramentas e às barras laterais do chat, além de manter as entradas de texto com pelo menos 16px para que o Safari móvel não aplique zoom automático ao receber foco.

## Gerenciar plugins

Abra **Plugins** na barra lateral ou use `/settings/plugins` em relação ao
caminho base configurado da Interface de Controle para navegar e gerenciar plugins sem sair
da Interface de Controle. Por exemplo, um caminho base `/openclaw` usa
`/openclaw/settings/plugins`. A página está sempre disponível, mesmo quando todos os
plugins opcionais estão desabilitados.

Plugins é uma central com quatro abas: **Instalados** e **Descobrir** gerenciam o código de plugins
em `/settings/plugins`, **Skills** hospeda o gerenciador de Skills por agente em
`/skills`, e **Workshop** hospeda a análise de propostas do Workshop de Skills em
`/skills/workshop`. Cada aba mantém sua própria URL, e a barra lateral exibe a
única entrada Plugins para todas elas.

A aba **Instalados** exibe o inventário local completo agrupado por categoria, com
contagens gerais. Cada linha abre uma visualização de detalhes; seu menu de opções (`…`)
habilita ou desabilita o plugin e oferece **Remover** para plugins instalados externamente.
Ela também lista os [servidores MCP](/pt-BR/cli/mcp) configurados e permite adicioná-los, desabilitá-los
e removê-los diretamente. A aba **Descobrir** é a loja: plugins em destaque
incluídos no OpenClaw, plugins externos oficiais e conectores MCP de um clique
para serviços populares. Digitar na caixa de pesquisa consulta o
[ClawHub](https://clawhub.ai/plugins) diretamente e acrescenta uma seção **Do ClawHub**
com contagens de downloads e selos de verificação da origem. Links diretos podem
apontar diretamente para a loja com `/settings/plugins?tab=discover`.

A aba **Skills** mantém o relatório de status das Skills, os controles para habilitar/desabilitar, a entrada da chave
de API e a pesquisa integrada de Skills no ClawHub, com escopo limitado ao agente selecionado. A
aba **Workshop** mantém o quadro do Workshop de Skills e o fluxo de análise de Hoje para
[propostas de Skills](/pt-BR/tools/skill-workshop).

Os plugins incluídos já estão presentes no Gateway e exibem **Habilitar** ou
**Desabilitar** em vez de **Instalar**. Por exemplo, o Workboard está incluído no
OpenClaw, mas vem desabilitado por padrão; portanto, sua ação é **Habilitar**. Plugins incluídos
no pacote não podem ser removidos, apenas desabilitados.

A leitura do catálogo e a pesquisa no ClawHub exigem `operator.read`. Instalar,
habilitar, desabilitar ou remover um plugin e alterar servidores MCP exige
`operator.admin`; essas ações permanecem desabilitadas para operadores somente leitura.

As instalações do ClawHub são executadas por meio do Gateway e mantêm as mesmas verificações de confiança, integridade
e política de instalação de plugins que outras instalações mediadas pelo Gateway. Instalar
ou remover o código de um plugin exige a reinicialização do Gateway. Habilitar ou desabilitar um
plugin instalado pode ser aplicado sem reinicialização quando o plugin e o runtime atual
do Gateway são compatíveis; caso contrário, a interface informa que uma reinicialização é
necessária. Conectores MCP baseados em OAuth exigem uma execução única de
`openclaw mcp login <name>` pela CLI depois de serem adicionados.

A página concentra-se intencionalmente em inventário, descoberta, instalação, habilitação
e remoção. Use [`openclaw plugins`](/pt-BR/cli/plugins) para fontes npm, git ou
de caminho local arbitrárias, atualizações e configuração avançada de plugins.

## Navegação pela barra lateral

A barra lateral fixa a navegação acima de uma lista de sessões rolável. Em configurações com vários agentes, cada agente aparece como uma seção recolhível de nível superior; expandir um agente permite navegar pelas sessões dele sem sair do chat aberto, e agentes recolhidos exibem um indicador de mensagens não lidas. Dentro de um agente, a lista é dividida em **Fixadas**, uma seção integrada para cada canal conectado (Telegram, Slack, WhatsApp, ...), uma seção integrada **Trabalho** para sessões vinculadas a uma árvore de trabalho gerenciada ou a um nó de execução (as linhas mostram uma linha `repo ⎇ branch` seguida do host do nó), grupos personalizados (a `category` da sessão) e **Chats** para as demais. As seções de canais e Trabalho classificam as linhas automaticamente; atribuir uma sessão a um grupo personalizado sempre prevalece. Abrir uma sessão move o destaque da seleção sem reordenar as linhas. Sessões com novas atividades desde a última leitura exibem um ponto de não lida, e abrir uma delas a marca como lida. Cada linha de sessão tem um menu de contexto (botão de reticências verticais ou clique com o botão direito) com Fixar/Desafixar, Marcar como não lida/lida, Renomear, Bifurcar, Mover para o grupo (incluindo Novo grupo e Remover do grupo), Arquivar e Excluir; layouts para telas sensíveis ao toque mantêm visíveis os controles diretos de fixação e menu. Cmd/Ctrl+clique alterna as linhas para uma seleção múltipla, e Shift+clique estende a seleção pela ordem visível; abrir o menu em uma linha selecionada oferece então ações em lote (Marcar N como não lidas/lidas, Mover N para o grupo, Arquivar N, Excluir N) que se aplicam a todas as sessões selecionadas, com uma única confirmação para a exclusão em lote. Arraste uma sessão para um grupo personalizado ou para **Chats** para movê-la. Os cabeçalhos de grupos personalizados podem ser recolhidos, expandidos ou arrastados para reordená-los; os nomes dos grupos e sua ordem ficam no Gateway (`sessions.groups.*`), portanto acompanham você entre navegadores, enquanto o estado recolhido permanece no perfil do navegador. Os cabeçalhos dos grupos também têm um menu (botão de reticências verticais ou clique com o botão direito) com Renomear grupo, Novo grupo e Excluir grupo; renomear ou excluir um grupo atualiza todas as sessões integrantes no servidor, inclusive as arquivadas, e excluir um grupo preserva suas sessões e as move de volta para Chats. O único **+** no cabeçalho da lista de sessões abre a página Nova sessão (veja abaixo). O controle de ordenação também tem uma opção Agrupar por: Agrupadas (padrão) ou Nenhuma para uma única lista simples (Fixadas permanece separada); a escolha é armazenada no perfil atual do navegador. **Uso**, **Automações** e **Plugins** ficam fixados por padrão; expanda **Mais** para acessar todos os outros destinos. Selecione **Editar itens fixados** em Mais ou clique com o botão direito na área de navegação para fixar ou desafixar destinos e restaurar os padrões. O conjunto de itens fixados e o estado de expansão de Mais são armazenados no perfil atual do navegador e persistem após recarregamentos.

## Página Nova sessão

O **+** no cabeçalho da lista de sessões da barra lateral abre um rascunho de página inteira em `/new`: nada é criado até que você envie a primeira mensagem. Uma linha de destino acima da caixa de mensagem define onde a sessão funciona: o agente (em configurações com vários agentes), onde a execução ocorre (**Gateway · local** ou um Node pareado que exponha `system.run`; requer `operator.admin`), a pasta (o padrão é o espaço de trabalho do agente; outros caminhos absolutos do Gateway exigem `operator.admin` e uma árvore de trabalho) e uma opção **Árvore de trabalho** com um seletor de branch base (baseado em `worktrees.branches`, portanto nenhum fetch é realizado) e um nome opcional para a árvore de trabalho (a branch se torna `openclaw/<name>`). O botão de navegação do chip de pasta abre um seletor de diretório embutido baseado no método `fs.listDir`, exclusivo para administradores. Seu nível superior mostra o Gateway e todos os Nodes conhecidos; Nodes offline e Nodes sem suporte à navegação em diretórios permanecem visíveis, mas desabilitados. Selecionar o Gateway inicia na pasta atual ou na pasta inicial do Gateway. Selecionar um Node compatível permite navegar pelo sistema de arquivos do host desse Node, vincula a execução a ele e usa diretamente o caminho absoluto selecionado no Node (árvores de trabalho gerenciadas continuam disponíveis somente no Gateway). O envio chama `sessions.create` com a primeira mensagem, portanto a execução começa na mesma viagem de ida e volta, e a interface salta para o chat da nova sessão. Se o Gateway criar a sessão, mas rejeitar esse primeiro envio, o chat preservará o prompt e o erro após recarregamentos; **Tentar novamente** envia a mensagem pela sessão já criada, em vez de criar outra.

Em **Configurações**, a barra lateral dedicada começa com um campo **Pesquisar configurações** para localizar rapidamente as seções de configurações.

  Um campo **Pesquisar** no topo da barra lateral abre a paleta de comandos (⌘K). Clicar na marca OpenClaw no cabeçalho da barra lateral abre a tela inicial limpa de Nova sessão. Quando algo exige ação — trabalhos Cron com falha ou atrasados, autenticação de modelo prestes a expirar ou expirada — indicadores compactos de atenção aparecem acima do rodapé da barra lateral e levam à página responsável ao serem clicados. O rodapé compacto reúne o status da conexão, **Configurações**, **Documentação**, o pareamento móvel e o seletor de modo de cor claro/escuro/sistema; quando o Gateway é executado a partir de um checkout do código-fonte em uma ramificação diferente de `main`, o rodapé também mostra o nome dessa ramificação em vermelho, deixando evidente à primeira vista que não se trata de um Gateway de lançamento (instalações de lançamento nunca o exibem). Shift-Command-Comma abre **Configurações** sem substituir o atalho Command-Comma do navegador. O cabeçalho da barra lateral também contém o botão de recolhimento (⌘B); recolhê-la oculta completamente a barra lateral para criar um espaço de trabalho com largura total, e um controle flutuante de expansão (ou ⌘B) a traz de volta; no app para macOS, esse controle fica integrado nativamente à barra de título. A barra lateral é o único elemento de navegação no desktop, sem barra superior. Em janelas estreitas, a barra lateral é substituída por uma gaveta deslizante atrás de uma linha de cabeçalho compacta que contém o botão da gaveta, a marca e a pesquisa da paleta de comandos; no app para macOS, essa linha de cabeçalho incorpora o espaço reservado à barra de título em uma única faixa compacta ao lado dos controles da janela. A navegação usa o histórico normal do navegador, portanto os botões voltar/avançar do navegador percorrem esse histórico; o app para macOS adiciona um controle nativo da barra lateral ao lado dos controles da janela, além de gestos de deslizar no trackpad, com botões voltar/avançar na borda direita da barra lateral quando ela está expandida e botões nativos de pesquisa (paleta de comandos) e nova sessão quando está recolhida.

  ## O que ele pode fazer (hoje)

  <AccordionGroup>
  <Accordion title="Chat e conversa">
    - Converse com o modelo pelo WebSocket do Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - As atualizações do histórico do chat solicitam uma janela recente limitada, com limites de texto por mensagem, para que sessões grandes não obriguem o navegador a renderizar a carga útil de uma transcrição completa antes que o chat possa ser usado.
    - Passar o cursor ou dar foco pelo teclado a um link público de issue ou pull request do GitHub mostra seu estado, título, autor, atividade recente, comentários e estatísticas de alterações. O Gateway conectado busca e armazena em cache os metadados públicos sem alterar o destino do link, inclusive quando a interface usa um Gateway remoto. O Gateway usa `GH_TOKEN` ou `GITHUB_TOKEN` quando disponíveis, após confirmar que o repositório é público; caso contrário, usa a API anônima do GitHub com um cache mais longo.
    - Converse por sessões em tempo real no navegador. A OpenAI usa WebRTC direto, o Google Live usa um token de navegador de uso único e restrito por WebSocket, e plugins de voz em tempo real exclusivos do backend usam o transporte de retransmissão do Gateway. Sessões de provedores controladas pelo cliente começam com `talk.client.create`; sessões de retransmissão do Gateway começam com `talk.session.create`. A retransmissão mantém as credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por `talk.session.appendAudio`, encaminha chamadas da ferramenta `openclaw_agent_consult` do provedor por `talk.client.toolCall` para aplicar a política do Gateway e usar o modelo OpenClaw maior configurado, e direciona o controle por voz de uma execução ativa por `talk.client.steer` ou `talk.session.steer`.
    - Transmita chamadas de ferramentas e cartões de saída de ferramentas em tempo real no Chat (eventos do agente). A atividade de ferramentas é renderizada como linhas adaptadas ao tipo: comandos do shell mostram o comando com realce de sintaxe e uma saída no estilo de terminal; chamadas compatíveis de edição e gravação mostram diffs embutidos limitados, números de linha quando disponíveis e estatísticas de `+added -removed`; e chamadas consecutivas são agrupadas em um resumo como "Executou 13 comandos, leu 6 arquivos, editou 9 arquivos". Enquanto uma execução está ativa, a chamada em andamento mais recente dá nome ao cabeçalho do grupo. Expanda uma linha para inspecionar os argumentos restantes e a saída bruta.
    - Títulos de finalidade opcionais gerados por IA para chamadas complexas de ferramentas (comandos longos do shell, ferramentas de plugins com muitos argumentos), habilitados com `gateway.controlUi.toolTitles: true` (desativados por padrão). Os títulos vêm do método `chat.toolTitles` em lote por meio do roteamento padrão de modelos utilitários — um `utilityModel` explícito (provedor escolhido pelo operador, como em outras tarefas utilitárias) ou, na ausência dele, o modelo pequeno padrão declarado pelo provedor da sessão — e são armazenados em cache no Gateway por agente. Quando a opção não está ativada ou não há um modelo econômico disponível, as linhas mantêm seus rótulos determinísticos e nenhuma chamada de modelo é feita.
    - Inicie ou descarte tarefas efêmeras de acompanhamento sugeridas pelo modelo; sugestões aceitas abrem uma nova sessão de árvore de trabalho gerenciada com o prompt proposto.
    - Aba de atividade com resumos locais do navegador, priorizando a redação de dados, sobre a atividade de ferramentas em tempo real proveniente da entrega existente de eventos `session.tool` / ferramentas.

  </Accordion>
  <Accordion title="Canais, sessões, memória">
    - Canais: status de canais integrados e de plugins incluídos/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - As atualizações de sondagem dos canais mantêm o instantâneo anterior visível enquanto as verificações lentas do provedor são concluídas e identificam instantâneos parciais quando uma sondagem ou auditoria excede o tempo reservado pela interface.
    - Sessões: liste por padrão as sessões dos agentes configurados, fixe sessões frequentes, renomeie-as, arquive ou restaure sessões inativas, use uma alternativa para chaves obsoletas de sessões de agentes não configurados e aplique substituições de modelo/pensamento/rápido/detalhado/rastreamento/raciocínio por sessão (`sessions.list`, `sessions.patch`). Sessões fixadas são ordenadas acima das sessões recentes não fixadas; sessões arquivadas ficam na visualização de arquivadas da página Sessões e mantêm suas transcrições. As linhas mostram um ponto de não lida para sessões com atividade desde a última leitura, com ações para marcar como não lida/marcar como lida (`sessions.patch { unread }`), e uma ação Bifurcar que ramifica a transcrição em uma nova sessão (`sessions.create { parentSessionKey, fork: true }`). Blocos de visão geral acima da tabela resumem o conjunto carregado (quantidade de sessões, execuções ativas, sessões não lidas, total de tokens), cada linha exibe um glifo de tipo com um ponto de execução ativa, o status é renderizado como um ponto simples acompanhado de um rótulo, e a coluna Tokens mostra um medidor de uso da janela de contexto quando a sessão informa as quantidades de tokens e o tamanho do contexto. As ações de gerenciamento ficam em um menu por linha (botão de reticências verticais ou clique com o botão direito), espelhando o menu de sessão da barra lateral, e a gaveta da linha apresenta o runtime do agente e a duração da execução junto aos outros detalhes da sessão.
    - Agrupamento de sessões: um controle Agrupar por organiza a tabela de sessões em seções por grupos personalizados, canal, tipo, agente ou data. Grupos personalizados persistem por sessão por meio de `sessions.patch` (`category`), portanto sessões iniciadas em canais de mensagens (Discord, Telegram, WhatsApp, ...) também podem ser categorizadas; atribua grupos arrastando linhas até uma seção ou usando o seletor de grupo por linha, e crie grupos com a ação Novo grupo.
    - Memória (uma aba na página Agentes, com escopo restrito ao agente selecionado): status do Dreaming, controle para ativar/desativar e leitor do Diário de Sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, tarefas, plugins, skills, dispositivos, aprovações de execução">
    - Automações (tarefas cron): cartões de estatísticas (quantidade de automações, quantidade de falhas, estado do agendador, próxima ativação) acima de um seletor de abas Automações/Histórico de execuções; a aba Automações lista as tarefas em uma tabela filtrável (Todas/Ativas/Pausadas, pesquisa, filtros de agendamento e última execução, menu de ações por linha), com sugestões iniciais abaixo, e a aba Histórico de execuções mostra as execuções recentes de todas as automações (`cron.*`).
    - Tarefas: registro em tempo real das tarefas em segundo plano ativas e recentes, com sessões vinculadas e cancelamento (`tasks.*`).
    - Plugins: navegue pelo inventário instalado e pela loja selecionada, pesquise no ClawHub, instale e remova código de plugins e habilite ou desabilite plugins instalados (`plugins.*`); as linhas de servidores MCP editam `mcp.servers` por meio dos métodos de configuração.
    - Skills: status, habilitar/desabilitar, instalar, atualizar chaves de API (`skills.*`).
    - Dispositivos: um único inventário reúne registros de dispositivos pareados, o catálogo de nodes e a presença em tempo real (`device.pair.list`, `node.list`, `system-presence`). O host do Gateway fica fixado primeiro; clientes pareados mostram status da conexão, funções, tokens, recursos e comandos. Pareamentos duplicados são agrupados em um grupo expansível, e **Limpar N obsoletos** remove em massa duplicatas offline confirmadas pelo administrador que foram aprovadas automaticamente (local silencioso, CIDR confiável ou verificadas por SSH) ou são anteriores ao registro da origem da aprovação. As entradas podem ser removidas (`node.pair.remove`, `device.pair.remove`), o pareamento de dispositivos e as novas aprovações de nodes são tratados diretamente na interface (`device.pair.*`, `node.pair.approve`/`reject`), e códigos de configuração para dispositivos móveis são criados no mesmo cartão.
    - Aprovações de execução: edite as listas de permissões do gateway ou do node e a política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuração">
    - Visualize/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Perfil: uma página de configurações que mostra a identidade do agente padrão com estatísticas de uso de todo o período — tokens acumulados, dia de pico, sessão mais longa, sequências de atividade, um mapa de calor anual de tokens, principais ferramentas e destaques dos canais (`usage.cost`, `sessions.usage`).
    - O MCP tem uma página de configurações dedicada com linhas de servidores somente leitura (transporte, habilitação e resumos de OAuth/filtros/paralelismo), comandos comuns para operadores e o editor de configuração com escopo `mcp`; a adição, habilitação/desabilitação e remoção de servidores ocorre na página Plugins.
    - Provedores de modelos: uma página de configurações que lista cada provedor de modelos configurado com seu ícone de marca, estado de autenticação (`models.authStatus`), disponibilidade de modelos (`models.list`), dados em tempo real de plano/cota/faturamento quando informados pelo provedor (`usage.status`) e os gastos das sessões locais nos últimos 30 dias (`sessions.usage`). Uma ação Atualizar relê o estado das credenciais e o uso do provedor.
    - Conexão: uma página de configurações (em **Conexões**) responsável pelo próprio vínculo do painel com o gateway — URL do WebSocket, token do gateway, senha e chave de sessão padrão — além do instantâneo mais recente do handshake (status, tempo de atividade, intervalo de pulsos, última atualização dos canais). A tela de login offline trata o caso desconectado; esta página edita a conexão enquanto ela está ativa.
    - Aplique e reinicie com validação (`config.apply`) e, em seguida, ative a última sessão ativa.
    - As gravações incluem uma proteção por hash de base para evitar a sobrescrita de edições simultâneas.
    - As gravações (`config.set`/`config.apply`/`config.patch`) verificam previamente a resolução de SecretRefs ativos para as referências na carga de configuração enviada; referências ativas enviadas que não possam ser resolvidas são rejeitadas antes da gravação.
    - Ao salvar, os formulários descartam espaços reservados ocultos obsoletos que não possam ser restaurados pela configuração salva, preservando os valores ocultos que ainda correspondem a segredos salvos.
    - O esquema e a renderização do formulário vêm de `config.schema` / `config.schema.lookup`, incluindo `title`/`description` dos campos, dicas correspondentes da interface, resumos de filhos imediatos, metadados da documentação em nodes aninhados de objeto/caractere curinga/matriz/composição, além de esquemas de plugins e canais quando disponíveis. O editor de JSON bruto só está disponível quando o instantâneo permite uma conversão de ida e volta segura em formato bruto; caso contrário, a Control UI força o modo Formulário.
    - A opção "Redefinir para o salvo" do editor de JSON bruto preserva a estrutura criada no formato bruto (formatação, comentários, disposição de `$include`) em vez de renderizar novamente um instantâneo achatado, para que edições externas sobrevivam a uma redefinição quando for possível converter o instantâneo com segurança nos dois sentidos.
    - Valores estruturados de objetos SecretRef são renderizados como somente leitura nas entradas de texto do formulário, para evitar a conversão acidental e corrompida de objeto em string.

  </Accordion>
  <Accordion title="Uso">
    - A análise de tokens e custos estimados derivada das sessões permanece separada do faturamento dos provedores.
    - Os cartões dos provedores chamam `usage.status` e mostram nomes de planos em tempo real, períodos de cota, saldos, gastos e orçamentos informados pelos plugins de provedores configurados.
    - Uma falha no uso de um provedor não bloqueia o painel de sessões/custos; cartões de provedores indisponíveis mostram seu próprio estado de erro.

  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: instantâneos de status/integridade/modelos, log de eventos e chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui tempos de atualização/RPC da Control UI, tempos lentos de renderização de chat/configuração e registros de capacidade de resposta do navegador para quadros de animação ou tarefas prolongadas quando o navegador expõe esses tipos de entrada do PerformanceObserver.
    - Logs: acompanhamento em tempo real dos logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git e reinicie (`update.run`) com um relatório de reinicialização; depois, consulte `update.status` após a reconexão para verificar a versão do gateway em execução.

  </Accordion>
  <Accordion title="Observações do painel de automações">
    - Selecionar uma linha abre uma visualização detalhada em página inteira com um seletor Ativa/Pausada e Executar agora no cabeçalho (executar se estiver no prazo, clonar e remover em seu menu); a aba Configurações edita a automação diretamente na interface (prompt, detalhes, frequência, substituições avançadas) e a aba Histórico de execuções mostra as execuções dessa automação.
    - As automações iniciais abaixo da tabela preenchem previamente o formulário de criação com um prompt e um agendamento editáveis.
    - Para tarefas isoladas, o padrão de entrega é anunciar um resumo; altere para nenhuma em execuções exclusivamente internas.
    - Os campos de canal/destino aparecem quando anunciar está selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de Webhook HTTP(S) válida.
    - Para tarefas da sessão principal, os modos de entrega Webhook e nenhuma estão disponíveis.
    - Os controles de edição avançada incluem excluir após a execução, limpar a substituição do agente, opções de horário exato/distribuição do cron, substituições de modelo/raciocínio do agente e seletores de entrega por melhor esforço.
    - A validação do formulário ocorre diretamente na interface, com erros por campo; valores inválidos desabilitam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o Webhook será enviado sem um cabeçalho de autenticação.
    - `cron.webhook` é um fallback legado obsoleto: execute `openclaw doctor --fix` para migrar tarefas armazenadas que ainda usam `notify: true` para entrega explícita por Webhook ou de conclusão em cada tarefa.

  </Accordion>
</AccordionGroup>

## Página do MCP

A página dedicada do MCP é uma visualização para operadores dos servidores MCP gerenciados pelo OpenClaw em `mcp.servers`. Ela não inicia os transportes MCP por conta própria; use-a para inspecionar e editar a configuração salva e depois use `openclaw mcp doctor --probe` quando precisar de comprovação do servidor em tempo real.

Fluxo de trabalho típico:

1. Abra **MCP** na barra lateral.
2. Verifique nos cartões de resumo as quantidades total, habilitada, com OAuth e de servidores filtrados.
3. Analise cada linha de servidor quanto a transporte, habilitação, autenticação, filtros, tempos limite e dicas de comandos.
4. Gerencie os servidores (adicionar, habilitar/desabilitar, remover) na página **Plugins**, que é o único editor interativo de `mcp.servers`; a lista de linhas nesta página contém um link para ela.
5. Edite a seção de configuração `mcp` com escopo definido para configurações de servidores, cabeçalhos, caminhos de TLS/mTLS, metadados de OAuth, filtros de ferramentas e metadados de projeção do Codex.
6. Use **Salvar** para gravar a configuração ou **Salvar e publicar** quando o Gateway em execução precisar aplicar a configuração alterada.
7. Execute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` em um terminal para realizar diagnósticos estáticos, comprovação em tempo real ou descarte do runtime em cache.

A página oculta valores semelhantes a URLs que contêm credenciais antes da renderização e coloca os nomes dos servidores entre aspas nos trechos de comandos, para que os comandos copiados continuem funcionando com espaços ou metacaracteres do shell. Referência completa da CLI e da configuração: [MCP](/pt-BR/cli/mcp).

## Aba Atividade

A aba Atividade fica em **Configurações › Sistema**, ao lado de Logs e Depuração. Ela é um observador efêmero e local do navegador para a atividade das ferramentas em tempo real, derivada do mesmo fluxo de eventos `session.tool` / de ferramentas do Gateway que alimenta os cartões de ferramentas do Chat. Ela não adiciona outra família de eventos do Gateway, endpoint, armazenamento durável de atividades, feed de métricas nem fluxo de observação externo.

As entradas de Atividade mantêm apenas resumos sanitizados e prévias de saída ocultas e truncadas. Os valores dos argumentos das ferramentas não são armazenados no estado de Atividade; a interface informa que os argumentos estão ocultos e registra apenas a quantidade de campos de argumentos. A lista em memória acompanha a aba atual do navegador, persiste durante a navegação na Control UI e é redefinida ao recarregar a página, trocar de sessão ou selecionar **Limpar**.

## Terminal do operador

O terminal acoplável do operador fica desabilitado por padrão. Para habilitá-lo, defina `gateway.terminal.enabled: true` e reinicie o Gateway. O terminal exige uma conexão `operator.admin` e abre um PTY do host no espaço de trabalho do agente ativo. Novas abas seguem o agente de chat atualmente selecionado.

<Warning>
O terminal é um shell de host irrestrito e herda o ambiente do processo do Gateway. Habilite-o somente em implantações com operadores confiáveis. O OpenClaw recusa sessões de terminal para agentes com `sandbox.mode: "all"`; alterar um agente ativo para esse modo encerra suas sessões de terminal existentes e em andamento.
</Warning>

Use **Ctrl + acento grave** para alternar a área acoplável. O layout permite acoplamento na parte inferior e à direita, é redimensionado conforme a janela do navegador e mantém várias abas de shell. Consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#gateway) para ver `gateway.terminal.enabled` e a substituição opcional `gateway.terminal.shell`.

As sessões sobrevivem a desconexões: recarregar a página, suspender o laptop ou uma breve falha de rede desconecta a sessão no Gateway em vez de encerrá-la, e a mesma aba do navegador se reconecta quando a conexão é restabelecida, reproduzindo a saída recente. Sessões desconectadas são encerradas após `gateway.terminal.detachedSessionTimeoutSeconds` (padrão de 300 segundos; `0` restaura o encerramento ao desconectar). `terminal.list` mostra as sessões que podem ser anexadas, `terminal.attach` adota uma delas (apropriação no estilo tmux) e `terminal.text` lê a saída recente de uma sessão como texto simples sem anexá-la — um recurso para agentes/ferramentas.

O terminal também está disponível como um documento de tela inteira exclusivo para terminal em `/?view=terminal`. Os aplicativos para iOS e Android incorporam essa página em suas telas de Terminal, reutilizando as credenciais armazenadas do gateway; a disponibilidade segue as mesmas condições `gateway.terminal.enabled` e `operator.admin`, e a página mostra um aviso quando o Gateway conectado não oferece o terminal.

## Painel do navegador

A Control UI inclui um painel de navegador acoplável que renderiza o navegador controlado pelo Gateway (o mesmo que os agentes operam por meio da [ferramenta de navegador](/pt-BR/tools/browser-control)) em qualquer navegador comum — sem exigir uma webview nativa. Ele aparece quando o Gateway conectado anuncia `browser.request` para uma conexão `operator.admin`; o botão de globo no trilho do espaço de trabalho da sessão o alterna. O painel mostra um instantâneo em tempo real da página com abas, uma barra de URL editável, voltar/avançar/recarregar e abrir no seu navegador, pode ser acoplado à direita ou na parte inferior e encaminha cliques, rolagem com a roda e digitação básica para a página remota.

Dois modos de captura empacotam o contexto da página para o agente:

- **Anotar (lápis)**: desenhe marcações à mão livre sobre a página. **Enviar ao chat** combina os traços com a captura de tela, anexa a imagem ao compositor do chat ativo e preenche previamente um prompt que descreve a URL e o título da página, além de cada região marcada, para que o agente saiba exatamente o que você circulou.
- **Inspecionar (ponteiro)**: passe o cursor para ver o elemento sob ele (seletor, nome acessível, função, tamanho); clique para enviar os detalhes desse elemento e uma captura de tela com destaque pelo mesmo fluxo do compositor. A inspeção, a rolagem com a roda e a navegação para voltar/avançar exigem `browser.evaluateEnabled` (ativado por padrão).

O aplicativo para macOS mantém sua barra lateral nativa de navegação de links para os links clicados no painel; o painel do navegador também funciona nela e é a forma de anotar páginas em todas as outras plataformas.

## Comportamento do chat

  <AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }`, e a resposta é transmitida por eventos `chat`. Clientes confiáveis da interface de controle também podem receber metadados opcionais de temporização da confirmação para diagnósticos locais.
    - Os uploads do chat aceitam imagens e arquivos que não sejam vídeos. As imagens mantêm o caminho nativo de imagem; outros arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexos.
    - Reenviar com a mesma `idempotencyKey` retorna `{ status: "in_flight" }` durante a execução e `{ status: "ok" }` após a conclusão.
    - As respostas de `chat.history` têm tamanho limitado para a segurança da interface. Quando as entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um espaço reservado (`[chat.history omitted: message too large]`).
    - Quando uma mensagem visível do assistente foi truncada em `chat.history`, o leitor lateral pode buscar sob demanda a entrada completa da transcrição normalizada para exibição por meio de `chat.message.get`, usando `sessionKey`, o `agentId` ativo quando necessário e o `messageId` da transcrição. Se o Gateway ainda não puder retornar mais conteúdo, o leitor exibirá um estado explícito de indisponibilidade em vez de repetir silenciosamente a prévia truncada.
    - Imagens do assistente/geradas são persistidas como referências de mídia gerenciada e disponibilizadas novamente por URLs de mídia autenticadas do Gateway, para que os recarregamentos não dependam da permanência de cargas de imagem base64 brutas na resposta do histórico do chat.
    - Ao renderizar `chat.history`, a interface de controle remove do texto visível do assistente as tags de diretivas embutidas destinadas apenas à exibição (por exemplo, `[[reply_to_*]]` e `[[audio_as_voice]]`), as cargas XML de chamadas de ferramentas em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramentas) e tokens de controle de modelo ASCII/de largura completa que tenham vazado. Ela omite entradas do assistente cujo texto visível completo seja apenas o token exato de silêncio `NO_REPLY` / `no_reply` ou o token de confirmação de Heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém visíveis as mensagens locais otimistas do usuário/assistente caso `chat.history` retorne brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais assim que o histórico do Gateway se atualiza.
    - Eventos `chat` em tempo real representam o estado de entrega, enquanto `chat.history` é reconstruído com base na transcrição durável da sessão. Após eventos finais de ferramentas, a interface de controle recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição está documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` acrescenta uma observação do assistente à transcrição da sessão e transmite um evento `chat` para atualizações exclusivas da interface (sem execução do agente e sem entrega ao canal).
    - A barra lateral lista todas as sessões ativas carregadas por seção de agente e nos grupos fixadas/canal/trabalho/personalizadas/Chats, com uma única ação Nova sessão que abre a caixa de diálogo de rascunho. Abrir uma linha visível altera apenas o destaque. Grupos personalizados podem ser recolhidos e reordenados por arrastar, e as sessões podem ser soltas sobre um grupo ou em Chats; os nomes e a ordem dos grupos são sincronizados pelo Gateway, enquanto o estado recolhido permanece no navegador. Uma nova sessão do painel recebe de forma assíncrona um título conciso gerado com base em sua primeira mensagem que não seja um comando; nomes explícitos nunca são substituídos. Defina `agents.defaults.utilityModel` (ou `agents.list[].utilityModel`) para direcionar essa chamada separada de modelo a um modelo de menor custo. Expandir a seção de outro agente permite navegar pelas sessões desse agente sem sair do chat aberto.
    - A pesquisa de sessões fica na paleta de comandos (⌘K ou o campo Pesquisar no topo da barra lateral): digitar uma consulta percorre um número limitado de páginas correspondentes entre agentes, filtra linhas internas filhas/de Cron e lista as correspondências visíveis ao lado dos comandos de navegação. A página Sessões mantém a lista completa pesquisável com filtros.
    - Cada linha da barra lateral mantém acesso direto à fixação e um menu de contexto completo para estado de não lida, renomear, bifurcar, agrupar, arquivar e excluir. Linhas com seleção múltipla (Cmd/Ctrl-clique, Shift-clique para intervalos) recebem um menu em lote que abrange estado de não lida, agrupamento, arquivamento e exclusão; arquivar/excluir em lote permanece desativado, a menos que todas as sessões selecionadas possam ser arquivadas. Uma execução ativa e a sessão principal de um agente não podem ser arquivadas. Arquivar ou excluir a sessão selecionada no momento faz o Chat voltar para a sessão principal desse agente.
    - No aplicativo para macOS, a marca do OpenClaw usa a faixa nativa da barra de título que estaria vazia ao lado dos controles da janela, em vez de ocupar uma linha da barra lateral.
    - Em larguras de desktop, os controles do chat permanecem em uma única linha compacta e são recolhidos ao rolar a transcrição para baixo; rolar para cima, voltar ao topo ou chegar ao fim restaura os controles.
    - Mensagens consecutivas duplicadas que contenham apenas texto são renderizadas como um único balão com um indicador de contagem. Mensagens que contenham imagens, anexos, saída de ferramentas ou prévias do Canvas não são agrupadas.
    - Quando o checkout de uma sessão está em uma ramificação não padrão de um repositório do GitHub, a visualização do chat fixa chips de solicitações de pull acima do compositor: número da PR, repositório, ramificação, contagens do diff, um indicador de CI e estado de rascunho/mesclada/fechada, cada um com link para a PR. A linha mostra no máximo dois chips — primeiro as PRs ativas (abertas/em rascunho) —, e um botão "Mostrar mais" revela o histórico recolhido de PRs mescladas/fechadas. O indicador de CI abre um pequeno popover de monitoramento de CI com as contagens de verificações aprovadas/com falha/em execução/ignoradas e um link para a página de verificações da PR. A detecção é executada no servidor por meio de `controlUi.sessionPullRequests`, que reutiliza o `GH_TOKEN`/`GITHUB_TOKEN` do Gateway quando definido. Quando o limite de taxa da API do GitHub é atingido, os chips mantêm o último status conhecido e exibem um aviso de que o status pode estar desatualizado; dispensar um chip o oculta para essa sessão no perfil atual do navegador.
    - O painel de diff da sessão mostra o que o checkout de uma sessão realmente alterou: o botão da ramificação (no cabeçalho do painel lateral do espaço de trabalho, no cabeçalho do painel dividido ou no botão flutuante do chat em painel único) abre o painel de detalhes com um diff por arquivo do trabalho da ramificação, não confirmado e não rastreado em relação à base de mesclagem da ramificação padrão do checkout — ponto de status, seta de renomeação, contagens de +/− por arquivo, arquivos recolhíveis e marcadores de "N linhas não modificadas" entre trechos. Os diffs são calculados no servidor pelo método `sessions.diff` do Gateway (escopo `operator.read`); arquivos binários e grandes demais são reduzidos a entradas somente com estatísticas, e o botão só aparece quando o Gateway conectado anuncia `sessions.diff`.
    - O painel lateral do espaço de trabalho da sessão em cada painel do Chat lista arquivos da sessão, arquivos do projeto e artefatos. Por padrão, ele é encaixado na borda direita do painel; arraste seu cabeçalho (ou use o botão de encaixe) para movê-lo para a parte inferior, e a escolha será armazenada no perfil atual do navegador. Um painel lateral recolhido não ocupa espaço algum: reabra-o com ⇧⌘B, com o controle de arquivos no cabeçalho do painel dividido ou com o botão flutuante de arquivos no chat em painel único (ambos exibem um indicador da contagem de arquivos alterados). O painel separado de detalhes de arquivos, ferramentas e Canvas não é afetado.
    - Clicar em uma referência de arquivo no chat, em um caminho de arquivo em um cartão expandido de ferramenta de leitura/edição/gravação ou em uma linha de arquivo no painel lateral do espaço de trabalho abre o painel de detalhes do arquivo: uma visualização de código baseada no CodeMirror com realce de sintaxe, números de linha, salto para linha, pesquisa no arquivo, ações de cópia e um menu para abrir em um editor externo. Quando o Gateway anuncia `sessions.files.set` para uma conexão `operator.admin`, o painel adiciona um modo Editar com rastreamento de alterações não salvas e salvamento por Cmd/Ctrl-S; rascunhos não salvos persistem durante a navegação entre arquivos, painéis e sessões na aba atual do navegador até serem explicitamente salvos ou descartados. Os salvamentos usam comparação e troca com base em um hash do conteúdo retornado por `sessions.files.get`: se o arquivo tiver sido alterado no disco desde que foi carregado (por exemplo, porque o agente continuou trabalhando), o painel exibirá um aviso de conflito com as ações Recarregar (usar o conteúdo mais recente) e Sobrescrever (manter a edição local). As gravações passam pelas mesmas proteções seguras de sistema de arquivos do espaço de trabalho usadas pelas leituras — confinamento de caminho, rejeição de links simbólicos/links físicos e limite de 256 KB em UTF-8 — e apenas sobrescrevem arquivos existentes; o editor nunca os cria nem exclui.
    - O painel lateral de tarefas em segundo plano em cada painel do Chat lista as tarefas em segundo plano e os subagentes do agente atual (`tasks.list` com escopo por agente, mantido atualizado por eventos `task`): trabalhos em execução exibem um cronômetro ao vivo do tempo decorrido, a contagem de usos de ferramentas, a ferramenta atualmente em uso e um controle para interromper; a seção recolhível de concluídos adiciona as durações das execuções; e um link Ver transcrição abre a sessão filha da tarefa no painel. Abra-o com o controle de atividade no cabeçalho do painel dividido ou com o botão flutuante de atividade no chat em painel único — o snapshot das tarefas é carregado antecipadamente, portanto ambos exibem um indicador da contagem de tarefas em execução sem que seja necessário abrir primeiro o painel lateral. A página Tarefas continua sendo o registro completo entre agentes.
    - O painel lateral do espaço de trabalho, o painel lateral de tarefas em segundo plano e o painel de detalhes se adaptam à largura de cada painel, e não à janela: em um painel estreito ou janela compacta, ambos os painéis laterais são apresentados como faixas inferiores (os controles de encaixe lateral ficam ocultos até que o painel fique mais largo; o painel lateral do espaço de trabalho tem prioridade para ocupar a posição lateral quando cabe apenas uma coluna), e o painel de detalhes é empilhado abaixo da conversa com uma alça horizontal de redimensionamento, em vez de compartilhar a mesma linha. Em áreas de visualização do tamanho de um telefone, o painel de detalhes ainda é aberto em tela cheia.
    - Os seletores de modelo e de raciocínio no cabeçalho do chat atualizam imediatamente a sessão ativa por meio de `sessions.patch`; eles são substituições persistentes da sessão, não opções de envio válidas para apenas uma interação.
    - **Visualização dividida:** abra-a pela linha de controles flutuantes no canto superior direito (ao lado dos controles de diff da sessão, tarefas em segundo plano e arquivos da sessão) e divida o painel ativo para a direita ou para baixo em quantos painéis couberem. Cada painel tem sua própria sessão, transcrição, compositor e fluxo de ferramentas.
    - Arraste uma sessão da barra lateral para o chat para abri-la em um painel. Uma prévia animada do destino desliza entre as zonas e identifica o resultado — "Dividir" sobre a metade exata que um novo painel ocupará, "Abrir aqui" sobre um painel inteiro —, e também é possível soltar no modo de painel único.
    - O painel dividido ativo controla a seleção da barra lateral e a URL. Cada painel tem sua própria linha de cabeçalho com o título da sessão e controles do painel lateral do espaço de trabalho, divisão e fechamento; os divisores redimensionam colunas e painéis empilhados, e o navegador armazena o layout localmente entre recarregamentos.
    - Em telas estreitas, a visualização dividida mantém o layout, mas renderiza apenas o painel ativo, incluindo seu cabeçalho com o controle de fechamento.
    - Se você enviar uma mensagem enquanto uma alteração no seletor de modelo para a mesma sessão ainda estiver sendo salva, o compositor aguardará a atualização dessa sessão antes de chamar `chat.send`, para que o envio use o modelo selecionado.
    - Digitar `/new` cria e alterna para a mesma nova sessão do painel que Novo chat, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, a sessão principal é redefinida no lugar. Digitar `/reset` mantém a redefinição explícita no lugar feita pelo Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada no Gateway. Se `agents.defaults.models` estiver presente, essa lista de permissões controlará o seletor, incluindo entradas `provider/*` que mantêm os catálogos com escopo por provedor dinâmicos. Caso contrário, o seletor mostrará entradas explícitas de `models.providers.*.models` e provedores com autenticação utilizável. O catálogo completo continua disponível pela RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios recentes de uso da sessão do Gateway incluem os tokens de contexto atuais, a barra de ferramentas do compositor do chat exibe um pequeno anel de uso do contexto com a porcentagem utilizada. Abra o anel para ver a janela de contexto atual, as contagens de tokens da execução mais recente e o custo total estimado, a identidade do provedor/modelo e o detalhamento mais recente dos custos de entrada/saída/cache da resposta do provedor, quando informado. O anel muda para um estilo de aviso quando há alta pressão de contexto e, nos níveis recomendados de Compaction, exibe um botão compacto que executa o fluxo normal de Compaction da sessão. Snapshots obsoletos de tokens ficam ocultos até que o Gateway informe novamente dados recentes de uso.

  </Accordion>
  <Accordion title="Modo de conversa (tempo real no navegador)">
    O modo de conversa usa um provedor de voz em tempo real registrado. Configure a OpenAI com `talk.realtime.provider: "openai"` e um perfil de chave de API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY`. O OpenAI Realtime usa a API pública da Platform e exige uma chave de API da Platform; um login OAuth do Codex não atende a essa interface. Configure o Google com `talk.realtime.provider: "google"` e `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API padrão do provedor: a OpenAI recebe um segredo efêmero de cliente do Realtime para WebRTC, e o Google Live recebe um token de autenticação de uso único e restrito da Live API para uma sessão WebSocket do navegador, com as instruções e declarações de ferramentas bloqueadas no token pelo Gateway. Os provedores que oferecem apenas uma ponte de tempo real de backend operam por meio do transporte de retransmissão do Gateway, de modo que as credenciais e os sockets do fornecedor permanecem no lado do servidor enquanto o áudio do navegador trafega por RPCs autenticadas do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instruções fornecidas pelo chamador.

    Os padrões persistentes de provedor, modelo, voz, transporte, esforço de raciocínio, limiar exato de VAD, duração do silêncio e preenchimento de prefixo ficam em **Configurações → Comunicações → Conversa**; alterá-los exige acesso `operator.admin`. Configurar a retransmissão do Gateway força o caminho de retransmissão do backend; configurar WebRTC mantém a sessão sob controle do cliente e falha, em vez de recorrer silenciosamente à retransmissão, caso o provedor não consiga criar uma sessão do navegador.

    O próprio controle de conversa é o botão de microfone na barra de ferramentas do compositor. Seu cursor lista **System default** e todos os microfones disponibilizados pelo navegador, incluindo entradas USB, Bluetooth e virtuais. O ID do dispositivo selecionado permanece local ao navegador e nunca é enviado ao Gateway; se esse dispositivo exato desaparecer, o modo de conversa solicitará que você escolha outra entrada, em vez de gravar silenciosamente com um microfone diferente. Enquanto o modo de conversa estiver ativo, o botão de microfone se transforma em uma pílula que mostra o medidor de nível da entrada ao vivo; clicar nela interrompe a entrada de voz, e passar o cursor sobre ela revela o ícone de parada. Os leitores de tela anunciam `Connecting voice input...`, `Listening...` ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por meio de `talk.client.toolCall`. Interromper uma resposta em execução do agente continua sendo uma ação separada, pelo controle quadrado **Parar** ao lado da pílula.

    Teste rápido ao vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a ponte WebSocket de backend da OpenAI, a troca de SDP WebRTC da OpenAI no navegador, a configuração do WebSocket do Google Live no navegador com token restrito e o adaptador de retransmissão do Gateway no navegador com mídia de microfone simulada. O comando exibe apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Parar** (chama `chat.abort`).
    - Enquanto uma execução estiver ativa, os acompanhamentos normais entram na fila. Clique em **Direcionar** em uma mensagem na fila para injetar esse acompanhamento no turno em execução.
    - Digite `/stop` (ou frases isoladas de aborto, como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial após aborto">
    - Quando uma execução é abortada, o texto parcial do assistente ainda pode ser exibido na interface.
    - O Gateway persiste o texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer.
    - As entradas persistidas incluem metadados de aborto para que os consumidores da transcrição possam distinguir trechos parciais abortados da saída de uma conclusão normal.

  </Accordion>
</AccordionGroup>

## Perda de conexão e reconexão

Depois que uma sessão é estabelecida, a queda da conexão com o Gateway não encerra sua sessão. O painel
permanece visível com uma pílula âmbar flutuante "Conexão com o Gateway perdida — Reconectando…" abaixo da barra
superior enquanto o cliente tenta novamente de forma automática com espera progressiva (de 800 ms até 15 s). As atualizações ao vivo e
as ações em tempo real/da sessão ficam pausadas até que a conexão seja restabelecida; **Tentar novamente agora** na pílula força uma
tentativa imediata. O chat permanece editável: envios comuns de texto e anexos são mantidos no
armazenamento do navegador com escopo de Gateway/sessão da aba atual, exibidos como aguardando a reconexão e enviados
automaticamente quando o Gateway retorna. Os controles ao vivo e os comandos de barra permanecem indisponíveis enquanto
estiver offline.

Quando este navegador já contém credenciais (um token/senha configurado ou um token de dispositivo
aprovado), a primeira abertura e os recarregamentos exibem uma pequena marca animada do OpenClaw enquanto a conexão é
estabelecida, em vez de mostrar brevemente a tela de login. A tela de login só aparece quando ainda não há credenciais
armazenadas ou quando o Gateway as rejeita ativamente (token/senha incorreto, pareamento revogado) —
estados que exigem sua intervenção, em vez de apenas aguardar.

## Instalação como PWA e Web Push

A interface de controle inclui um `manifest.webmanifest` e um service worker, portanto navegadores modernos podem instalá-la como uma PWA independente. O Web Push permite que o Gateway desperte a PWA instalada com notificações mesmo quando a aba ou a janela do navegador não estiver aberta.

Se a página exibir **Incompatibilidade de protocolo** logo após uma atualização do OpenClaw, primeiro reabra o painel com `openclaw dashboard` e faça uma atualização forçada. Se a falha persistir, limpe os dados do site da origem do painel ou teste em uma janela privativa do navegador; uma aba antiga ou o cache do service worker do navegador pode continuar executando um pacote da interface de controle anterior à atualização com o Gateway mais recente.

| Interface                                             | O que faz                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifesto da PWA. Os navegadores oferecem "Install app" quando ele está acessível. |
| `ui/public/sw.js`                                     | Service worker que processa eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (no diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente e usado para assinar cargas do Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints persistidos das assinaturas do navegador.                  |

Substitua o par de chaves VAPID por meio de variáveis de ambiente no processo do Gateway quando quiser fixar as chaves (implantações com vários hosts, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `https://openclaw.ai`)

A interface de controle usa estes métodos do Gateway com escopo restrito para registrar e testar assinaturas do navegador:

- `push.web.vapidPublicKey` obtém a chave pública VAPID ativa.
- `push.web.subscribe` registra um `endpoint` junto com `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` remove um endpoint registrado.
- `push.web.test` envia uma notificação de teste para a assinatura do chamador.

<Note>
O Web Push é independente do caminho de retransmissão APNS do iOS (consulte [Configuração](/pt-BR/gateway/configuration) para notificações push baseadas em retransmissão) e do método `push.test`, que se destina ao pareamento móvel nativo.
</Note>

## Conteúdo incorporado hospedado

As mensagens do assistente podem renderizar conteúdo web hospedado diretamente na página com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

O Plugin Canvas incluído também oferece [`show_widget`](/tools/show-widget) para renderizar SVG ou HTML autocontido diretamente de uma chamada de ferramenta. O navegador anuncia a capacidade `inline-widgets` do Gateway, e o documento Canvas resultante continua disponível quando o histórico do chat é recarregado. Execuções originadas em canais não recebem essa ferramenta.

<Tabs>
  <Tab title="estrito">
    Desativa a execução de scripts dentro do conteúdo incorporado hospedado.
  </Tab>
  <Tab title="scripts (padrão)">
    Permite conteúdo incorporado interativo, mantendo o isolamento de origem; geralmente é suficiente para jogos/widgets autocontidos no navegador.
  </Tab>
  <Tab title="confiável">
    Adiciona `allow-same-origin` além de `allow-scripts` para documentos do mesmo site que precisam intencionalmente de privilégios mais amplos.
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
Use `trusted` somente quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos gerados por agentes e canvas interativos, `scripts` é a opção mais segura.
</Warning>

URLs externas absolutas de incorporação `http(s)` permanecem bloqueadas por padrão. Para permitir que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura das mensagens do chat

A transcrição do chat usa uma área centralizada e de leitura confortável, alinhada ao compositor. As saídas do assistente e das ferramentas permanecem alinhadas à esquerda, enquanto os balões do usuário permanecem alinhados à direita dentro dessa área. Implantações em monitores largos podem substituir a largura da transcrição sem modificar o CSS incluído, definindo `gateway.controlUi.chatMessageMaxWidth`:

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
    Mantenha o Gateway em loopback e permita que o Tailscale Serve faça o proxy dele com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado).

    Por padrão, as solicitações do Control UI/WebSocket Serve podem ser autenticadas por meio dos cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o ao cabeçalho, e só aceita esses cabeçalhos quando a solicitação chega pelo loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador do Control UI com identidade de dispositivo do navegador, esse caminho verificado do Serve também ignora o processo de pareamento do dispositivo; navegadores sem identidade de dispositivo e conexões com função de Node ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para o tráfego do Serve e, em seguida, use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade do Serve, as tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações do limite de taxa. Portanto, novas tentativas inválidas simultâneas do mesmo navegador podem exibir `retry later` na segunda solicitação, em vez de duas divergências simples disputarem em paralelo.

    <Warning>
    A autenticação do Serve sem token pressupõe que o host do Gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
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

Se você abrir o painel por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador será executado em um **contexto não seguro** e bloqueará a WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões do Control UI sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade com HTTP não seguro somente para localhost usando `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida do Control UI para operadores por meio de `gateway.auth.mode: "trusted-proxy"`
- recurso emergencial `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    - Ela permite que sessões locais da UI de Controle prossigam sem identidade do dispositivo em contextos HTTP não seguros.
    - Ela não ignora as verificações de pareamento.
    - Ela não flexibiliza os requisitos de identidade do dispositivo para acessos remotos (fora do localhost).

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
    `dangerouslyDisableDeviceAuth` desativa as verificações de identidade do dispositivo da UI de Controle e reduz gravemente a segurança. Reverta essa configuração rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Observação sobre proxy confiável">
    - Uma autenticação bem-sucedida por proxy confiável pode admitir sessões de **operador** da UI de Controle sem identidade do dispositivo.
    - Isso **não** se estende a sessões da UI de Controle com função de Node.
    - Proxies reversos de loopback no mesmo host ainda não satisfazem a autenticação por proxy confiável; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para obter orientações sobre a configuração de HTTPS.

## Política de segurança de conteúdo

A UI de Controle inclui uma política `img-src` restrita: somente recursos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagens remotas `http(s)` e relativas ao protocolo são rejeitadas pelo navegador e nunca geram solicitações de rede.

Na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) continuam sendo renderizados, incluindo rotas de avatar autenticadas que a UI busca e converte em URLs `blob:` locais.
- URLs `data:image/...` embutidas continuam sendo renderizadas.
- URLs `blob:` locais criadas pela UI de Controle continuam sendo renderizadas.
- Os avatares de pré-visualizações de links do GitHub são buscados pelo Gateway no host fixo de avatares do GitHub e retornados como URLs `data:` com tamanho limitado; o navegador do operador nunca entra em contato com o host remoto de avatares.
- URLs remotas de avatares emitidas pelos metadados de canais são removidas pelos auxiliares de avatar da UI de Controle e substituídas pelo logotipo/selo integrado, portanto um canal comprometido ou mal-intencionado não pode forçar buscas arbitrárias de imagens remotas pelo navegador de um operador.

Isso está sempre ativado e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do Gateway está configurada, o endpoint de avatar da UI de Controle exige o mesmo token do Gateway usado pelo restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente para clientes autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas a qualquer uma das rotas são rejeitadas (assim como na rota relacionada de mídia do assistente), portanto a rota de avatar não pode vazar a identidade do agente em hosts que estejam protegidos de outras formas.
- A UI de Controle encaminha o token do Gateway como um cabeçalho bearer ao buscar avatares e usa URLs de blob autenticadas para que a imagem continue sendo renderizada nos painéis.

Se você desativar a autenticação do Gateway (não recomendado em hosts compartilhados), a rota de avatar também ficará sem autenticação, de acordo com o restante do Gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do Gateway está configurada, as pré-visualizações de mídia local do assistente usam uma rota de duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da UI de Controle; o navegador envia o token do Gateway como um cabeçalho bearer ao verificar a disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração com escopo limitado ao caminho de origem exato.
- URLs de imagens, áudio, vídeo e documentos renderizadas pelo navegador usam `mediaTicket=<ticket>` em vez do token ou da senha ativa do Gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

Isso mantém a renderização de mídia compatível com os elementos de mídia nativos do navegador sem expor credenciais reutilizáveis do Gateway em URLs de mídia visíveis.

## Links de aprovação

As notificações de aprovação do operador podem conter links diretos para um documento de aprovação independente servido no namespace reservado `${controlUiBasePath}/approve/{approvalId}` (por exemplo, `/approve/<approvalId>` ou `/openclaw/approve/<approvalId>` com um caminho base configurado). A URL permanece estável durante toda a vigência da aprovação e pode ser encaminhada com segurança entre seus próprios dispositivos: ela identifica a aprovação, mas nunca a autoriza.

- O namespace de um segmento `/approve/<approvalId>` é reservado pelo Gateway antes das rotas HTTP de plugins para **todos** os métodos HTTP, portanto uma rota de Plugin nunca pode substituir nem interceptar um documento de aprovação.
- A abertura de um documento de aprovação exige a mesma autenticação do Gateway usada pelo restante da UI de Controle (token/senha, identidade do Tailscale Serve ou identidade de proxy confiável); as credenciais nunca fazem parte da URL de aprovação.
- Quando a disponibilização da UI de Controle está desativada, as solicitações ao namespace retornam `404` em vez de serem encaminhadas aos manipuladores de plugins.
- O login em um documento de aprovação é temporário para essa página: ele não substitui a seleção nem as configurações do Gateway salvas pela UI de Controle completa no mesmo navegador.

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

Em seguida, aponte a UI para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Página em branco da UI de Controle

Se o navegador carregar um painel em branco e o DevTools não mostrar nenhum erro útil, uma extensão ou um script de conteúdo executado antecipadamente pode ter impedido a avaliação do aplicativo de módulo JavaScript. A página estática inclui um painel simples de recuperação em HTML que aparece quando `<openclaw-app>` não é registrado após a inicialização.

Use a ação **Tentar novamente** do painel após alterar o ambiente do navegador ou recarregue manualmente depois destas verificações:

- Desative extensões que injetam conteúdo em todas as páginas, especialmente extensões com scripts de conteúdo `<all_urls>`.
- Experimente uma janela privada, um perfil de navegador limpo ou outro navegador.
- Mantenha o Gateway em execução e verifique a mesma URL do painel após trocar o navegador.

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A UI de Controle consiste em arquivos estáticos; o destino do WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você deseja executar o servidor de desenvolvimento do Vite localmente, mas o Gateway está em outro lugar.

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

    Autenticação única opcional (se necessária):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações">
    - `gatewayUrl` é armazenado no localStorage após o carregamento e removido da URL.
    - Se você fornecer um endpoint `ws://` ou `wss://` completo por meio de `gatewayUrl`, codifique o valor para URL para que o navegador analise a string de consulta corretamente.
    - Sempre que possível, `token` deve ser fornecido por meio do fragmento da URL (`#token=...`). Fragmentos não são enviados ao servidor, o que evita vazamentos em logs de solicitações e no Referer. Parâmetros de consulta legados `?token=` ainda são importados uma vez para compatibilidade, mas somente como fallback, e são removidos imediatamente após a inicialização.
    - `password` é mantida somente na memória.
    - Quando `gatewayUrl` está definido, a UI não recorre às credenciais da configuração nem do ambiente. Forneça `token` (ou `password`) explicitamente; a ausência de credenciais explícitas é um erro.
    - Use `wss://` quando o Gateway estiver protegido por TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada), para evitar clickjacking.
    - Implantações públicas da UI de Controle fora do loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Carregamentos privados de mesma origem em LAN/Tailnet a partir de hosts de loopback, RFC1918/link-local, `.local`, `.ts.net` ou CGNAT do Tailscale são aceitos sem ativar o fallback do cabeçalho Host.
    - A inicialização do Gateway pode preencher origens locais, como `http://localhost:<port>` e `http://127.0.0.1:<port>`, usando o vínculo e a porta efetivos do runtime, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]`, exceto em testes locais estritamente controlados; isso significa permitir qualquer origem de navegador, não "corresponder a qualquer host que eu esteja usando".
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
- [TUI](/pt-BR/web/tui) — interface de usuário do terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador
