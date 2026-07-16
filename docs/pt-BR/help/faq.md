---
read_when:
    - Respondendo a perguntas comuns de suporte sobre configuração, instalação, integração ou ambiente de execução
    - Triagem de problemas relatados por usuários antes de uma depuração mais aprofundada
summary: Perguntas frequentes sobre instalação, configuração e uso do OpenClaw
title: Perguntas frequentes
x-i18n:
    generated_at: "2026-07-16T12:31:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 913757fcc748a15370dc49874b54184d891c954df45b76c8a3212da5bc1da845
    source_path: help/faq.md
    workflow: 16
---

Respostas rápidas e solução de problemas mais aprofundada para configurações reais (desenvolvimento local, VPS, múltiplos agentes, OAuth/chaves de API, failover de modelos). Para diagnósticos de runtime, consulte [Solução de problemas](/pt-BR/gateway/troubleshooting). Para a referência completa de configuração, consulte [Configuração](/pt-BR/gateway/configuration).

## Primeiros 60 segundos se algo estiver quebrado

<Steps>
  <Step title="Status rápido">
    ```bash
    openclaw status
    ```
    Resumo local rápido: SO + atualização, acessibilidade do gateway/serviço, agentes/sessões, configuração do provedor + problemas de runtime (quando o gateway está acessível).
  </Step>
  <Step title="Relatório copiável (seguro para compartilhar)">
    ```bash
    openclaw status --all
    ```
    Diagnóstico somente leitura com o trecho final do log (tokens ocultados).
  </Step>
  <Step title="Estado do daemon + porta">
    ```bash
    openclaw gateway status
    ```
    Mostra o runtime do supervisor em comparação com a acessibilidade via RPC, a URL de destino da sondagem e qual configuração o serviço provavelmente usou.
  </Step>
  <Step title="Sondagens aprofundadas">
    ```bash
    openclaw status --deep
    ```
    Sondagem de integridade em tempo real do gateway, incluindo sondagens de canais quando compatíveis (requer um gateway acessível). Consulte [Integridade](/pt-BR/gateway/health).
  </Step>
  <Step title="Acompanhar o log mais recente">
    ```bash
    openclaw logs --follow
    ```
    Se o RPC estiver indisponível, use como alternativa:
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    Os logs em arquivos são separados dos logs do serviço; consulte [Logs](/pt-BR/logging) e [Solução de problemas](/pt-BR/gateway/troubleshooting).
  </Step>
  <Step title="Executar o doctor (reparos)">
    ```bash
    openclaw doctor
    ```
    Repara/migra a configuração e o estado e, em seguida, executa verificações de integridade. Consulte [Doctor](/pt-BR/gateway/doctor).
  </Step>
  <Step title="Snapshot do Gateway (somente WS)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # mostra a URL de destino + o caminho da configuração em caso de erros
    ```
    Solicita ao gateway em execução um snapshot completo. Consulte [Integridade](/pt-BR/gateway/health).
  </Step>
</Steps>

## Início rápido e configuração da primeira execução

As perguntas e respostas sobre a primeira execução — instalação, integração inicial, rotas de autenticação, assinaturas e falhas iniciais — estão nas [Perguntas frequentes sobre a primeira execução](/pt-BR/help/faq-first-run).

## O que é o OpenClaw?

<AccordionGroup>
  <Accordion title="O que é o OpenClaw, em um parágrafo?">
    O OpenClaw é um assistente pessoal de IA que você executa em seus próprios dispositivos. Ele responde nas plataformas de mensagens que você já usa (Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp e plugins de canais incluídos, como o QQ Bot) e também pode oferecer voz e um Canvas em tempo real nas plataformas compatíveis. O **Gateway** é o plano de controle sempre ativo; o assistente é o produto.
  </Accordion>

  <Accordion title="Proposta de valor">
    O OpenClaw não é "apenas um wrapper do Claude". Ele é um **plano de controle local-first** que executa um assistente avançado em **seu próprio hardware**, acessível pelos aplicativos de conversa que você já usa, com sessões com estado, memória e ferramentas — sem entregar seus fluxos de trabalho a um SaaS hospedado.

    - **Seus dispositivos, seus dados**: execute o Gateway onde quiser (Mac, Linux, VPS) e mantenha o workspace e o histórico das sessões localmente.
    - **Canais reais, não um sandbox web**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp/etc., além de voz móvel e Canvas nas plataformas compatíveis.
    - **Independente de modelo**: use Anthropic, MiniMax, OpenAI, OpenRouter etc., com roteamento por agente e failover.
    - **Opção somente local**: execute modelos locais para que todos os dados permaneçam em seu dispositivo.
    - **Roteamento de múltiplos agentes**: agentes separados por canal, conta ou tarefa, cada um com seu próprio workspace e padrões.
    - **Código aberto e personalizável**: inspecione, amplie e hospede por conta própria, sem dependência de fornecedor.

    Documentação: [Gateway](/pt-BR/gateway), [Canais](/pt-BR/channels), [Múltiplos agentes](/pt-BR/concepts/multi-agent), [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Acabei de configurá-lo — o que devo fazer primeiro?">
    Bons primeiros projetos: criar um site (WordPress, Shopify ou um site estático); prototipar um aplicativo móvel (estrutura, telas, plano de API); organizar arquivos e pastas; conectar o Gmail e automatizar resumos ou acompanhamentos.

    Ele consegue lidar com tarefas grandes, mas funciona melhor quando elas são divididas em fases, com subagentes realizando trabalhos em paralelo.

  </Accordion>

  <Accordion title="Quais são os cinco principais casos de uso cotidiano do OpenClaw?">
    - **Resumos pessoais**: resumos da caixa de entrada, do calendário e das notícias relevantes para você.
    - **Pesquisa e redação**: pesquisas rápidas, resumos e primeiros rascunhos de emails ou documentos.
    - **Lembretes e acompanhamentos**: alertas e listas de verificação acionados por Cron ou Heartbeat.
    - **Automação do navegador**: preencher formulários, coletar dados e repetir tarefas na web.
    - **Coordenação entre dispositivos**: envie uma tarefa pelo celular, deixe o Gateway executá-la em um servidor e receba o resultado de volta na conversa.

  </Accordion>

  <Accordion title="O OpenClaw pode ajudar com geração de leads, prospecção, anúncios e blogs para um SaaS?">
    Sim, para **pesquisa, qualificação e redação**: analisar sites, criar listas de candidatos, resumir informações sobre clientes em potencial e escrever rascunhos de mensagens de prospecção ou textos de anúncios.

    Para **campanhas de prospecção ou anúncios**, mantenha uma pessoa envolvida no processo. Evite spam, siga as leis locais e as políticas das plataformas e revise tudo antes do envio. Deixe o OpenClaw criar o rascunho; você aprova.

    Documentação: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são as vantagens em relação ao Claude Code para desenvolvimento web?">
    O OpenClaw é um **assistente pessoal** e uma camada de coordenação, não um substituto para a IDE. Use Claude Code ou Codex para obter o ciclo mais rápido de programação direta dentro de um repositório. Use o OpenClaw para memória persistente, acesso entre dispositivos e orquestração de ferramentas.

    - Memória e workspace persistentes entre sessões.
    - Acesso multiplataforma (Telegram, WhatsApp, TUI, WebChat).
    - Orquestração de ferramentas (navegador, arquivos, agendamento, hooks).
    - Gateway sempre ativo (execute em um VPS e interaja de qualquer lugar).
    - Nodes para navegador/tela/câmera/execução locais.

    Exemplos: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills e automação

<AccordionGroup>
  <Accordion title="Como personalizo Skills sem manter alterações pendentes no repositório?">
    Use substituições gerenciadas em vez de editar a cópia do repositório. Coloque as alterações em `~/.openclaw/skills/<name>/SKILL.md` (ou adicione uma pasta por meio de `skills.load.extraDirs` em `~/.openclaw/openclaw.json`). Precedência: `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> incluídas -> `skills.load.extraDirs`, portanto, as substituições gerenciadas têm prioridade sobre as Skills incluídas sem alterar o git. Para instalar globalmente, mas limitar a visibilidade a alguns agentes, mantenha a cópia compartilhada em `~/.openclaw/skills` e controle a visibilidade com `agents.defaults.skills` / `agents.list[].skills`. Somente alterações adequadas ao projeto upstream devem ser enviadas como PRs para a cópia do repositório.
  </Accordion>

  <Accordion title="Posso carregar Skills de uma pasta personalizada?">
    Sim: adicione diretórios por meio de `skills.load.extraDirs` em `~/.openclaw/openclaw.json` (a menor precedência na ordem acima). `clawhub` instala em `./skills` por padrão, que o OpenClaw trata como `<workspace>/skills` na próxima sessão. Para limitar a visibilidade a determinados agentes, combine com `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Como posso usar modelos ou configurações diferentes para tarefas diferentes?">
    Padrões compatíveis:

    - **Tarefas Cron**: tarefas isoladas podem definir uma substituição de `model` por tarefa.
    - **Agentes**: encaminhe tarefas para agentes separados com diferentes modelos padrão, níveis de raciocínio e parâmetros de streaming.
    - **Troca sob demanda**: `/model` troca o modelo da sessão atual a qualquer momento.

    Exemplo — mesmo modelo, configurações diferentes por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Coloque os padrões compartilhados por modelo em `agents.defaults.models["provider/model"].params` e, depois, as substituições específicas de cada agente no formato plano `agents.list[].params`. Não duplique o mesmo modelo dentro de `agents.list[].models["provider/model"].params` aninhado; esse caminho destina-se ao catálogo de modelos e às substituições de runtime por agente.

    Consulte [Tarefas Cron](/pt-BR/automation/cron-jobs), [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent), [Configuração](/pt-BR/gateway/config-agents), [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="O bot trava ao realizar trabalhos pesados. Como posso transferi-los?">
    Use **subagentes** para tarefas longas ou paralelas: eles são executados em suas próprias sessões, retornam um resumo e mantêm a conversa principal responsiva. Peça ao bot para "iniciar um subagente para esta tarefa" ou use `/subagents`. Use `/status` para verificar se o Gateway está ocupado no momento.

    Tanto as tarefas longas quanto os subagentes consomem tokens; defina um modelo mais econômico para os subagentes por meio de `agents.defaults.subagents.model` se o custo for importante.

    Documentação: [Subagentes](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Como funcionam as sessões de subagentes vinculadas a threads no Discord?">
    Vincule uma thread do Discord a um subagente ou destino de sessão para que as mensagens de acompanhamento nela permaneçam na sessão vinculada.

    - Inicie com `sessions_spawn` usando `thread: true` (opcionalmente, `mode: "session"` para acompanhamento persistente).
    - Ou vincule manualmente com `/focus <target>`.
    - `/agents` inspeciona o estado da vinculação.
    - `/session idle <duration|off>` e `/session max-age <duration|off>` controlam a remoção automática de foco.
    - `/unfocus` desvincula a thread.

    Configuração: `session.threadBindings.enabled` (controle global), `session.threadBindings.idleHours` (padrão `24`, `0` desativa), `session.threadBindings.maxAgeHours` (padrão `0` = sem limite rígido) e substituições por canal `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions` controla a vinculação automática ao iniciar (padrão `true`).

    Documentação: [Subagentes](/pt-BR/tools/subagents), [Discord](/pt-BR/channels/discord), [Referência de configuração](/pt-BR/gateway/configuration-reference), [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Um subagente terminou, mas a atualização de conclusão foi enviada ao lugar errado ou nunca foi publicada. O que devo verificar?">
    Verifique a rota resolvida do solicitante:

    - A entrega de subagentes no modo de conclusão dá preferência a uma thread vinculada ou rota de conversa, quando existente.
    - Se a origem da conclusão contiver apenas um canal, o OpenClaw usa como alternativa a rota armazenada da sessão do solicitante (`lastChannel` / `lastTo` / `lastAccountId`) para que a entrega direta ainda possa ser realizada.
    - Sem uma rota vinculada nem uma rota armazenada utilizável: a entrega direta pode falhar, e o resultado passa para a entrega enfileirada da sessão em vez de ser publicado imediatamente.
    - Destinos inválidos ou obsoletos também podem forçar o uso da fila como alternativa ou causar falha definitiva na entrega.
    - Se a última resposta visível do assistente filho for exatamente `NO_REPLY` / `no_reply` ou `ANNOUNCE_SKIP`, o OpenClaw suprime intencionalmente o anúncio em vez de publicar um progresso anterior obsoleto.

    Depuração: `openclaw tasks show <lookup>`, em que `<lookup>` é um ID de tarefa, ID de execução ou chave de sessão.

    Documentação: [Subagentes](/pt-BR/tools/subagents), [Tarefas em segundo plano](/pt-BR/automation/tasks), [Ferramentas de sessão](/pt-BR/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou lembretes não são acionados. O que devo verificar?">
    O Cron é executado dentro do processo do Gateway; ele não é acionado se o Gateway não estiver em execução continuamente.

    - Confirme se o Cron está habilitado (`cron.enabled`) e se `OPENCLAW_SKIP_CRON` não está definido.
    - Confirme se o Gateway está em execução 24/7 (sem suspensão/reinicializações).
    - Verifique o fuso horário da tarefa (`--tz` em comparação com o fuso horário do host).

    Depuração:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [Automação](/pt-BR/automation).

  </Accordion>

  <Accordion title="O Cron foi acionado, mas nada foi enviado ao canal. Por quê?">
    Verifique o modo de entrega:

    - `--no-deliver` / `delivery.mode: "none"`: não é esperado nenhum envio de fallback pelo executor.
    - Destino de anúncio ausente ou inválido (`channel` / `to`): o executor ignorou a entrega de saída.
    - Falhas de autenticação do canal (`unauthorized`, `Forbidden`): o executor tentou entregar, mas as credenciais impediram.
    - Um resultado isolado silencioso (apenas `NO_REPLY` / `no_reply`) é tratado como intencionalmente não entregável, portanto a entrega de fallback enfileirada também é suprimida.

    Para tarefas Cron isoladas, o agente ainda pode enviar diretamente com a ferramenta `message` quando uma rota de chat estiver disponível. `--announce` controla apenas a entrega de fallback do executor para o texto final que o próprio agente ainda não enviou.

    Depuração:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [Tarefas em segundo plano](/pt-BR/automation/tasks).

  </Accordion>

  <Accordion title="Por que uma execução Cron isolada trocou de modelo ou repetiu a tentativa uma vez?">
    Esse é o caminho ativo de troca de modelo, não um agendamento duplicado. O Cron isolado persiste uma transferência de modelo em tempo de execução e repete a tentativa quando a execução ativa lança `LiveSessionModelSwitchError`, mantendo o provedor/modelo selecionado (e qualquer substituição de perfil de autenticação selecionada) antes de repetir.

    Precedência da seleção de modelo: primeiro, a substituição de modelo do hook do Gmail (`hooks.gmail.model`); depois, o `model` por tarefa; em seguida, qualquer substituição de modelo armazenada na sessão do Cron; por fim, a seleção normal do modelo do agente/padrão.

    O ciclo de novas tentativas é limitado à tentativa inicial mais 2 tentativas de troca; depois disso, o Cron é interrompido em vez de continuar indefinidamente.

    Depuração:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [CLI do Cron](/pt-BR/cli/cron).

  </Accordion>

  <Accordion title="Como instalo Skills no Linux?">
    Use comandos nativos de `openclaw skills` ou coloque as Skills no seu espaço de trabalho; a interface de Skills do macOS não está disponível no Linux. Explore as Skills em [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    Por padrão, o `openclaw skills install` nativo grava no diretório `skills/` do espaço de trabalho ativo. Adicione `--global` para instalar no diretório compartilhado de Skills gerenciadas para todos os agentes locais. Instale a CLI `clawhub` separada apenas para publicar ou sincronizar suas próprias Skills. Use `agents.defaults.skills` ou `agents.list[].skills` para restringir quais agentes veem as Skills compartilhadas.

  </Accordion>

  <Accordion title="O OpenClaw pode executar tarefas de forma agendada ou continuamente em segundo plano?">
    Sim, por meio do agendador do Gateway:

    - **Tarefas Cron** para tarefas agendadas ou recorrentes (persistem após reinicializações).
    - **Heartbeat** para verificações periódicas da sessão principal.
    - **Tarefas isoladas** para agentes autônomos que publicam resumos ou fazem entregas em chats.

    Documentação: [Tarefas Cron](/pt-BR/automation/cron-jobs), [Automação](/pt-BR/automation), [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso executar Skills exclusivas do Apple macOS no Linux?">
    Não diretamente. As Skills do macOS são condicionadas por `metadata.openclaw.os` e pelos binários necessários, e só são carregadas quando são elegíveis no **host do Gateway**. No Linux, as Skills exclusivas de `darwin` (`apple-notes`, `apple-reminders`, `things-mac`) não serão carregadas, a menos que essa condição seja substituída.

    Três padrões compatíveis:

    **Opção A — executar o Gateway em um Mac (mais simples)**. Execute o Gateway onde os binários do macOS existem e conecte-se pelo Linux no [modo remoto](#gateway-ports-already-running-and-remote-mode) ou pelo Tailscale. As Skills são carregadas normalmente porque o host do Gateway é o macOS.

    **Opção B — usar um Node macOS (sem SSH)**. Execute o Gateway no Linux, emparelhe um Node macOS (aplicativo da barra de menus) e defina **Node Run Commands** como "Always Ask" ou "Always Allow" no Mac. O OpenClaw considera as Skills exclusivas do macOS elegíveis quando os binários necessários existem no Node; o agente as executa por meio da ferramenta `nodes`. Com "Always Ask", aprovar "Always Allow" na solicitação adiciona o comando à lista de permissões.

    **Opção C — encaminhar binários do macOS por SSH (avançado)**. Mantenha o Gateway no Linux, mas faça com que os binários da CLI necessários sejam resolvidos para wrappers SSH que executam em um Mac e, em seguida, substitua a Skill para permitir o Linux, mantendo-a elegível.

    1. Crie um wrapper SSH para o binário (exemplo: `memo` para o Apple Notes):
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Coloque o wrapper em `PATH` no host Linux (por exemplo, `~/bin/memo`).
    3. Substitua os metadados da Skill (no espaço de trabalho ou em `~/.openclaw/skills`) para permitir o Linux:
       ```markdown
       ---
       name: apple-notes
       description: Gerencie o Apple Notes por meio da CLI memo no macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Inicie uma nova sessão para atualizar o snapshot das Skills.

  </Accordion>

  <Accordion title="Existe uma integração com Notion ou HeyGen?">
    Ela não vem integrada atualmente. Opções:

    - **Skill / Plugin personalizado**: melhor para acesso confiável à API (ambos têm APIs).
    - **Automação do navegador**: funciona sem código, mas é mais lenta e frágil.

    Para um contexto por cliente no estilo de agências: mantenha uma página do Notion para cada cliente (contexto + preferências + trabalho ativo) e peça ao agente para buscar essa página no início de cada sessão.

    Para uma integração nativa, abra uma solicitação de recurso ou crie uma Skill usando essas APIs.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    As instalações nativas são colocadas no diretório `skills/` do espaço de trabalho ativo; use `--global` para todos os agentes locais ou configure `agents.defaults.skills` / `agents.list[].skills` para limitar a visibilidade. Algumas Skills esperam binários instalados pelo Homebrew; no Linux, isso significa Linuxbrew.

    Consulte [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config), [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Como uso meu Chrome existente, no qual já iniciei sessão, com o OpenClaw?">
    Use o perfil de navegador `user` integrado, que se conecta por meio do Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Para usar um nome personalizado, crie um perfil MCP explícito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Isso pode usar o navegador do host local ou um Node de navegador conectado. Se o Gateway for executado em outro lugar, execute um host de Node na máquina do navegador ou use o CDP remoto.

    Limitações atuais dos perfis `existing-session` / `user` em comparação com o perfil gerenciado `openclaw`:

    - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem referências de snapshot, não seletores CSS.
    - Os hooks de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem `element` CSS.
    - `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem o caminho do navegador gerenciado.

    Consulte [Navegador](/pt-BR/tools/browser#existing-session-via-chrome-devtools-mcp) para ver a comparação completa.

  </Accordion>
</AccordionGroup>

## Sandboxing e memória

<AccordionGroup>
  <Accordion title="Existe uma documentação específica sobre sandboxing?">
    Sim: [Sandboxing](/pt-BR/gateway/sandboxing). Para configurações específicas do Docker (Gateway completo no Docker ou imagens de sandbox), consulte [Docker](/pt-BR/install/docker).
  </Accordion>

  <Accordion title="O Docker parece limitado — como habilito todos os recursos?">
    A imagem padrão prioriza a segurança e é executada como o usuário `node`, portanto exclui pacotes do sistema, Homebrew e navegadores incluídos. Para uma configuração mais completa:

    - Persista `/home/node` com `OPENCLAW_HOME_VOLUME` para preservar os caches.
    - Inclua as dependências do sistema na imagem com `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Instale os navegadores do Playwright pela CLI incluída: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - Defina `PLAYWRIGHT_BROWSERS_PATH` e persista esse caminho.

    Documentação: [Docker](/pt-BR/install/docker), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Posso manter as DMs pessoais, mas tornar os grupos públicos e isolados em sandbox com um único agente?">
    Sim, se o tráfego privado ocorrer em **DMs** e o tráfego público em **grupos**. Defina `agents.defaults.sandbox.mode: "non-main"` para que as sessões de grupo/canal (chaves que não sejam a principal) sejam executadas no backend de sandbox configurado, enquanto a sessão principal de DM permanece no host. O Docker é o backend padrão quando o sandboxing está habilitado. Restrinja as ferramentas disponíveis nas sessões em sandbox por meio de `tools.sandbox.tools`.

    Guia de configuração: [Grupos: DMs pessoais + grupos públicos](/pt-BR/channels/groups#pattern-personal-dms-public-groups-single-agent). Referência principal: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Como vinculo uma pasta do host ao sandbox?">
    Defina `agents.defaults.sandbox.docker.binds` como `["host:container:mode"]` (por exemplo, `"/home/user/src:/src:ro"`). As vinculações globais e por agente são mescladas; as vinculações por agente são ignoradas quando `scope: "shared"`. Use `:ro` para qualquer conteúdo confidencial; as vinculações contornam as barreiras do sistema de arquivos do sandbox.

    O OpenClaw valida as origens das vinculações tanto pelo caminho normalizado quanto pelo caminho canônico resolvido por meio do ancestral existente mais profundo. Assim, tentativas de escape por um diretório pai que seja um link simbólico são bloqueadas de forma segura, mesmo quando o segmento final do caminho ainda não existe.

    Consulte [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs. Política de ferramentas vs. Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Como funciona a memória?">
    A memória do OpenClaw consiste em arquivos Markdown no espaço de trabalho do agente: anotações diárias em `memory/YYYY-MM-DD.md` e anotações selecionadas de longo prazo em `MEMORY.md` (somente sessões principais/privadas).

    O OpenClaw também executa uma **descarga de memória pré-Compaction** silenciosa antes que a Compaction resuma a conversa, lembrando o modelo de gravar primeiro as anotações duráveis. Ela só é executada quando o espaço de trabalho permite gravação (sandboxes somente leitura a ignoram); desabilite-a com `agents.defaults.compaction.memoryFlush.enabled: false`. Consulte [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="A memória continua esquecendo as coisas. Como faço para que sejam preservadas?">
    Peça ao bot para **gravar o fato na memória**: as anotações de longo prazo ficam em `MEMORY.md` e o contexto de curto prazo em `memory/YYYY-MM-DD.md`. Lembrar o modelo de armazenar memórias geralmente resolve o problema. Se ele continuar esquecendo, verifique se o Gateway usa o mesmo espaço de trabalho em todas as execuções.

    Documentação: [Memória](/pt-BR/concepts/memory), [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="A memória persiste para sempre? Quais são os limites?">
    Os arquivos de memória ficam no disco e persistem até serem excluídos; o limite é o armazenamento, não o modelo. O **contexto da sessão** ainda é limitado pela janela de contexto do modelo, portanto, conversas longas podem passar por compactação ou truncamento — é por isso que existe a busca na memória, que traz de volta ao contexto apenas as partes relevantes.

    Documentação: [Memória](/pt-BR/concepts/memory), [Contexto](/pt-BR/concepts/context).

  </Accordion>

  <Accordion title="A busca semântica na memória exige uma chave de API da OpenAI?">
    Somente se forem usados **embeddings da OpenAI**, que são o provedor padrão. O OAuth do Codex abrange chat/conclusões e **não** concede acesso a embeddings, portanto, entrar com o Codex (OAuth ou login da CLI do Codex) não habilita a busca semântica na memória. Os embeddings da OpenAI ainda exigem uma chave de API real (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Para manter tudo local, defina `agents.defaults.memorySearch.provider: "local"` (GGUF/llama.cpp). Outros provedores compatíveis: Bedrock, DeepInfra, Gemini (`GEMINI_API_KEY` ou `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, compatíveis com OpenAI e Voyage. Consulte [Memória](/pt-BR/concepts/memory) e [Busca na memória](/pt-BR/concepts/memory-search) para obter detalhes de configuração.

  </Accordion>
</AccordionGroup>

## Onde os itens ficam no disco

<AccordionGroup>
  <Accordion title="Todos os dados usados com o OpenClaw são salvos localmente?">
    Não: **o estado do próprio OpenClaw é local**, mas **os serviços externos ainda veem o que é enviado a eles**.

    - **Local por padrão**: sessões, arquivos de memória, configuração e espaço de trabalho ficam no host do Gateway (`~/.openclaw` mais o diretório do espaço de trabalho).
    - **Remoto por necessidade**: as mensagens enviadas aos provedores de modelos (Anthropic/OpenAI/etc.) vão para as APIs deles, e as plataformas de chat (Slack/Telegram/WhatsApp/etc.) armazenam os dados das mensagens nos próprios servidores.
    - **Você controla a presença dos dados**: os modelos locais mantêm os prompts na máquina, mas o tráfego dos canais ainda passa pelos servidores do canal.

    Relacionados: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace), [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Onde o OpenClaw armazena seus dados?">
    Tudo fica em `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`):

    | Caminho                                                            | Finalidade                                                          |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | Configuração principal (JSON5)                                      |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | Importação legada de OAuth (copiada para os perfis de autenticação no primeiro uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | Perfis de autenticação (OAuth, chaves de API, `keyRef`/`tokenRef` opcionais) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | Carga secreta opcional armazenada em arquivo para provedores SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | Arquivo de compatibilidade legado (entradas `api_key` estáticas removidas) |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | Estado do provedor (por exemplo, `whatsapp/<accountId>/creds.json`) |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | Estado por agente (agentDir mais artefatos de sessão legados/arquivados) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | Estado SQLite por agente, incluindo linhas de sessão e transcrições |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | Origens de migração de sessões legadas e artefatos de arquivo/suporte |

    O caminho legado de agente único `~/.openclaw/agent/*` é migrado por `openclaw doctor`.

    O **espaço de trabalho** (AGENTS.md, arquivos de memória, Skills etc.) é separado e configurado por meio de `agents.defaults.workspace` (padrão: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Onde devem ficar AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Esses arquivos ficam no **espaço de trabalho do agente**, não em `~/.openclaw`.

    - **Espaço de trabalho (por agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, e `HEARTBEAT.md` opcional. O arquivo raiz em minúsculas `memory.md` serve apenas como entrada de reparo legado; `openclaw doctor --fix` pode mesclá-lo em `MEMORY.md` quando ambos existem.
    - **Diretório de estado (`~/.openclaw`)**: configuração, estado de canais/provedores, perfis de autenticação, sessões, logs e Skills compartilhadas (`~/.openclaw/skills`).

    O espaço de trabalho padrão é `~/.openclaw/workspace` e pode ser configurado:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se o bot "esquecer" após uma reinicialização, confirme se o Gateway usa o mesmo espaço de trabalho em cada inicialização (o modo remoto usa o espaço de trabalho do **host do gateway**, não o notebook local).

    Dica: para um comportamento ou uma preferência durável, peça ao bot para **registrá-la em AGENTS.md ou MEMORY.md** em vez de depender do histórico do chat.

    Consulte [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace) e [Memória](/pt-BR/concepts/memory).

  </Accordion>

  <Accordion title="Posso aumentar o SOUL.md?">
    Sim. `SOUL.md` é um dos arquivos de inicialização do espaço de trabalho injetados no contexto do agente. O limite padrão de injeção por arquivo é de `20000` caracteres; o orçamento total de inicialização entre os arquivos é de `60000` caracteres.

    Altere os padrões compartilhados:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Ou substitua a configuração de um agente em `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars`.

    Use `/context` para verificar os tamanhos brutos e injetados e se houve truncamento. Mantenha `SOUL.md` focado em voz, postura e personalidade; coloque as regras operacionais em `AGENTS.md` e os fatos duráveis na memória.

    Consulte [Contexto](/pt-BR/concepts/context) e [Configuração do agente](/pt-BR/gateway/config-agents).

  </Accordion>

  <Accordion title="Estratégia de backup recomendada">
    Coloque o **espaço de trabalho do agente** em um repositório git **privado** e faça backup em algum lugar privado (por exemplo, GitHub privado). Isso registra a memória, além dos arquivos AGENTS/SOUL/USER, e permite restaurar a "mente" do assistente posteriormente.

    **Não** faça commit de nada em `~/.openclaw` (credenciais, sessões, tokens, cargas de segredos criptografados). Para uma restauração completa, faça backup do espaço de trabalho e do diretório de estado separadamente.

    Documentação: [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Como desinstalo completamente o OpenClaw?">
    Consulte [Desinstalação](/pt-BR/install/uninstall).
  </Accordion>

  <Accordion title="Os agentes podem trabalhar fora do espaço de trabalho?">
    Sim. O espaço de trabalho é o **cwd padrão** e a âncora da memória, não um sandbox rígido. Caminhos relativos são resolvidos dentro do espaço de trabalho; caminhos absolutos podem acessar outros locais do host, a menos que o sandbox esteja habilitado. Para isolamento, use [`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) ou as configurações de sandbox por agente. Para tornar um repositório o diretório de trabalho padrão, aponte o `workspace` desse agente para a raiz do repositório — o próprio repositório do OpenClaw é apenas código-fonte, portanto, mantenha o espaço de trabalho separado, a menos que queira intencionalmente que o agente trabalhe dentro dele.

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modo remoto: onde fica o armazenamento de sessões?">
    O estado das sessões pertence ao **host do gateway**. No modo remoto, o armazenamento de sessões relevante fica na máquina remota, não no notebook local. Consulte [Gerenciamento de sessões](/pt-BR/concepts/session).
  </Accordion>
</AccordionGroup>

## Noções básicas de configuração

<AccordionGroup>
  <Accordion title="Qual é o formato da configuração? Onde ela fica?">
    O OpenClaw lê uma configuração **JSON5** opcional de `$OPENCLAW_CONFIG_PATH` (padrão: `~/.openclaw/openclaw.json`). Se o arquivo não existir, ele usa padrões razoavelmente seguros, incluindo o espaço de trabalho padrão `~/.openclaw/workspace`.
  </Accordion>

  <Accordion title='Defini gateway.bind: "lan" (ou "tailnet") e agora nada fica escutando / a interface informa que não há autorização'>
    Vinculações fora do loopback **exigem um caminho válido de autenticação do gateway**: autenticação por segredo compartilhado (token ou senha) ou `gateway.auth.mode: "trusted-proxy"` atrás de um proxy reverso com reconhecimento de identidade configurado corretamente.

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    - `gateway.remote.token` / `.password` **não** habilitam sozinhos a autenticação do gateway local; os caminhos de chamadas locais podem usar `gateway.remote.*` como alternativa somente quando `gateway.auth.*` não estiver definido.
    - Para autenticação por senha, defina `gateway.auth.mode: "password"` mais `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `.password` estiver configurado explicitamente via SecretRef e não for resolvido, a resolução falhará de forma fechada (sem alternativa remota para mascarar a falha).
    - As configurações da interface de controle com segredo compartilhado são autenticadas por meio de `connect.params.auth.token` ou `connect.params.auth.password` (armazenado nas configurações do aplicativo/interface). Modos com identidade, como Tailscale Serve ou `trusted-proxy`, usam cabeçalhos de solicitação — evite colocar segredos compartilhados em URLs.
    - Com `gateway.auth.mode: "trusted-proxy"`, proxies reversos de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explícito e uma entrada de loopback em `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Por que agora preciso de um token no localhost?">
    O OpenClaw exige autenticação do gateway por padrão, inclusive em loopback. Se nenhum caminho explícito de autenticação estiver configurado, a inicialização usa o modo de token e gera, para essa inicialização, um token válido somente durante a execução; portanto, os clientes WS locais precisam se autenticar. Isso impede que outros processos locais chamem o Gateway.

    Configure `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` ou `OPENCLAW_GATEWAY_PASSWORD` explicitamente quando os clientes precisarem de um segredo estável entre reinicializações. Também é possível escolher o modo de senha ou `trusted-proxy` para proxies reversos com reconhecimento de identidade. Para um loopback aberto, defina `gateway.auth.mode: "none"` explicitamente. `openclaw doctor --generate-gateway-token` gera um token a qualquer momento.

  </Accordion>

  <Accordion title="Preciso reiniciar após alterar a configuração?">
    O Gateway monitora a configuração e oferece suporte a recarregamento dinâmico: `gateway.reload.mode: "hybrid"` (padrão) aplica dinamicamente as alterações seguras e reinicia em caso de alterações críticas. `hot`, `restart` e `off` também são compatíveis. A maioria das alterações de `tools.*`, política de `agents.*`, `session.*` e `messages.*` é aplicada imediatamente, sem qualquer ação de recarregamento; alterações de vinculação/porta em `gateway.*` exigem reinicialização.
  </Accordion>

  <Accordion title="Como desabilito os slogans engraçados da CLI?">
    Defina `cli.banner.taglineMode`:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: oculta o texto do slogan, mas mantém a linha de título/versão do banner.
    - `default`: sempre usa `All your chats, one OpenClaw.`.
    - `random`: alterna entre slogans engraçados/sazonais (comportamento padrão).
    - Para não exibir nenhum banner, defina a variável de ambiente `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Como habilito a pesquisa na Web (e a busca de conteúdo da Web)?">
    `web_fetch` funciona sem uma chave de API. `web_search` depende do provedor selecionado:

    | Provedor | Sem chave | Variável(is) de ambiente |
    | --- | --- | --- |
    | Brave | Não | `BRAVE_API_KEY` |
    | DuckDuckGo | Sim (não oficial, baseado em HTML) | - |
    | Exa | Não | `EXA_API_KEY` |
    | Firecrawl | Não | `FIRECRAWL_API_KEY` |
    | Gemini | Não | `GEMINI_API_KEY` |
    | Grok | Não (OAuth da xAI ou chave) | `XAI_API_KEY` |
    | Kimi | Não | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |
    | MiniMax Search | Não | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY` |
    | Ollama Web Search | Sim (requer `ollama signin`) | - |
    | Perplexity | Não | `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY` |
    | SearXNG | Sim (auto-hospedado) | `SEARXNG_BASE_URL` |
    | Tavily | Não | `TAVILY_API_KEY` |

    O Grok também pode reutilizar o OAuth da xAI da autenticação do modelo (`openclaw onboard --auth-choice xai-oauth`).

    **Recomendado**: `openclaw configure --section web` e escolha um provedor.

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
            enabled: true,
            provider: "firecrawl", // opcional; omita para detecção automática
          },
        },
      },
    }
    ```

    A configuração de pesquisa na web específica do provedor fica em `plugins.entries.<plugin>.config.webSearch.*`. Os caminhos legados de provedores em `tools.web.search.*` ainda são carregados para compatibilidade, mas não devem ser usados em novas configurações. A configuração de fallback de busca na web do Firecrawl fica em `plugins.entries.firecrawl.config.webFetch.*`.

    - Listas de permissões: adicione `web_search`/`web_fetch`/`x_search` ou `group:web` para os três.
    - `web_fetch` fica habilitado por padrão.
    - Se `tools.web.fetch.provider` for omitido, o OpenClaw detectará automaticamente o primeiro provedor de fallback de busca pronto entre as credenciais disponíveis; o plugin oficial do Firecrawl fornece esse fallback.
    - Os daemons leem variáveis de ambiente de `~/.openclaw/.env` (ou do ambiente do serviço).

    Documentação: [Ferramentas da web](/pt-BR/tools/web).

  </Accordion>

  <Accordion title="config.apply apagou minha configuração. Como recuperá-la e evitar que isso aconteça?">
    `config.apply` substitui a **configuração inteira**; um objeto parcial remove todo o restante.

    A versão atual do OpenClaw evita a maioria das substituições acidentais:

    - As gravações de configuração controladas pelo OpenClaw validam toda a configuração resultante antes de gravá-la.
    - Gravações inválidas ou destrutivas controladas pelo OpenClaw são rejeitadas e salvas como `openclaw.json.rejected.*`.
    - Uma edição direta que interrompa a inicialização ou o recarregamento dinâmico faz o Gateway falhar de forma fechada ou ignorar o recarregamento; ela não regrava `openclaw.json`.
    - `openclaw doctor --fix` é responsável pelo reparo, pode restaurar a última configuração válida conhecida e salva o arquivo rejeitado como `openclaw.json.clobbered.*`.

    Para recuperar:

    - Verifique `openclaw logs --follow` em busca de `Invalid config at`, `Config write rejected:` ou `config reload skipped (invalid config)`.
    - Inspecione o `openclaw.json.clobbered.*` ou `openclaw.json.rejected.*` mais recente ao lado da configuração ativa.
    - Execute `openclaw config validate` e `openclaw doctor --fix`.
    - Copie de volta apenas as chaves desejadas com `openclaw config set` ou `config.patch`.
    - Sem a última configuração válida conhecida ou a carga rejeitada: restaure a partir de um backup ou execute `openclaw doctor` novamente e reconfigure canais/modelos.
    - Perda inesperada: registre um bug com a última configuração conhecida ou um backup. Um agente de programação local geralmente consegue reconstruir uma configuração funcional a partir de logs ou do histórico.

    Para evitar isso: use `openclaw config set` para pequenas alterações, `openclaw configure` para edições interativas, `config.schema.lookup` para inspecionar um caminho desconhecido (retorna um nó de esquema superficial e resumos dos filhos imediatos) e `config.patch` para edições RPC parciais — reserve `config.apply` para substituir toda a configuração. A ferramenta de runtime `gateway` voltada ao agente se recusa a regravar `tools.exec.ask` / `tools.exec.security`, mesmo por meio dos aliases legados `tools.bash.*`.

    Documentação: [Configuração](/pt-BR/cli/config), [Configurar](/pt-BR/cli/configure), [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/pt-BR/gateway/doctor).

  </Accordion>

  <Accordion title="Como executo um Gateway central com workers especializados em vários dispositivos?">
    Padrão comum: **um Gateway** (por exemplo, um Raspberry Pi) mais **Nodes** e **agentes**.

    - **Gateway (central)**: gerencia canais (Signal/WhatsApp), roteamento e sessões.
    - **Nodes (dispositivos)**: Macs/iOS/Android se conectam como periféricos e disponibilizam ferramentas locais (`system.run`, `canvas`, `camera`).
    - **Agentes (workers)**: cérebros/espaços de trabalho separados para funções especiais (por exemplo, operações em comparação com dados pessoais).
    - **Subagentes**: iniciam trabalho em segundo plano a partir de um agente principal para processamento em paralelo.
    - **TUI**: conecta-se ao Gateway e alterna entre agentes/sessões.

    Documentação: [Nodes](/pt-BR/nodes), [Acesso remoto](/pt-BR/gateway/remote), [Roteamento multiagente](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [TUI](/pt-BR/web/tui).

  </Accordion>

  <Accordion title="O navegador do OpenClaw pode ser executado em modo headless?">
    Sim:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    O padrão é `false` (com interface gráfica). O modo headless tem maior probabilidade de acionar verificações antibot em alguns sites (o X/Twitter costuma bloquear sessões headless). Ele usa o mesmo mecanismo Chromium e funciona para a maioria das automações; a principal diferença é a ausência de uma janela visível do navegador (use capturas de tela para elementos visuais). Consulte [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Como uso o Brave para controlar o navegador?">
    Defina `browser.executablePath` como o binário do Brave (ou de qualquer navegador baseado em Chromium) e reinicie o Gateway. Consulte [Navegador](/pt-BR/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways e Nodes remotos

<AccordionGroup>
  <Accordion title="Como os comandos se propagam entre o Telegram, o Gateway e os Nodes?">
    As mensagens do Telegram são processadas pelo **Gateway**, que executa o agente e somente depois chama os Nodes pelo **WebSocket do Gateway** quando uma ferramenta do Node é necessária:

    Telegram -> Gateway -> Agente -> `node.*` -> Node -> Gateway -> Telegram

    Os Nodes não recebem tráfego de entrada do provedor; eles recebem apenas chamadas RPC de Node.

  </Accordion>

  <Accordion title="Como meu agente pode acessar meu computador se o Gateway estiver hospedado remotamente?">
    Emparelhe seu computador como um **Node**. O Gateway é executado em outro local, mas pode chamar ferramentas `node.*` (tela, câmera, sistema) na sua máquina local pelo WebSocket do Gateway.

    1. Execute o Gateway no host sempre ligado (VPS/servidor doméstico).
    2. Coloque o host do Gateway e seu computador na mesma tailnet.
    3. Garanta que o WS do Gateway esteja acessível (vinculação à tailnet ou túnel SSH).
    4. Abra o aplicativo do macOS localmente e conecte-se no modo **Remote over SSH** (ou diretamente pela tailnet) para que ele seja registrado como um Node.
    5. Aprove o Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Nenhuma ponte TCP separada é necessária; os Nodes se conectam pelo WebSocket do Gateway.

    Lembrete de segurança: emparelhar um Node do macOS permite `system.run` nessa máquina. Emparelhe apenas dispositivos confiáveis; consulte [Segurança](/pt-BR/gateway/security).

    Documentação: [Nodes](/pt-BR/nodes), [Protocolo do Gateway](/pt-BR/gateway/protocol), [Modo remoto do macOS](/pt-BR/platforms/mac/remote), [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O Tailscale está conectado, mas não recebo respostas. O que fazer?">
    Verifique o básico:

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    Em seguida, verifique a autenticação e o roteamento: se você usa o Tailscale Serve, confirme se `gateway.auth.allowTailscale` está definido corretamente; se a conexão é feita por um túnel SSH, confirme se o túnel está ativo e aponta para a porta correta; confirme se as listas de permissões de mensagens diretas/grupos incluem sua conta.

    Documentação: [Tailscale](/pt-BR/gateway/tailscale), [Acesso remoto](/pt-BR/gateway/remote), [Canais](/pt-BR/channels).

  </Accordion>

  <Accordion title="Duas instâncias do OpenClaw podem se comunicar entre si (local + VPS)?">
    Sim, embora não haja uma ponte integrada entre bots.

    **Mais simples**: use um canal de conversa normal que ambos os bots possam acessar (Slack/Telegram/WhatsApp). Faça o Bot A enviar uma mensagem ao Bot B e deixe o Bot B responder normalmente.

    **Ponte de CLI (genérica)**: execute um script que chame o outro Gateway com `openclaw agent --message ... --deliver`, tendo como destino uma conversa em que o outro bot esteja escutando. Se um dos bots estiver em um VPS remoto, aponte sua CLI para esse Gateway remoto por SSH/Tailscale (consulte [Acesso remoto](/pt-BR/gateway/remote)):

    ```bash
    openclaw agent --message "Olá do bot local" --deliver --channel telegram --reply-to <chat-id>
    ```

    Adicione uma proteção para que os dois bots não entrem em um loop infinito (somente menções, listas de permissões de canais ou uma regra de "não responder a mensagens de bots").

    Documentação: [Acesso remoto](/pt-BR/gateway/remote), [CLI do agente](/pt-BR/cli/agent), [Envio do agente](/pt-BR/tools/agent-send).

  </Accordion>

  <Accordion title="Preciso de VPSs separadas para vários agentes?">
    Não. Um Gateway hospeda vários agentes, cada um com seu próprio espaço de trabalho, padrões de modelo e roteamento — essa é a configuração normal e é muito mais barata e simples do que ter uma VPS por agente. Use VPSs separadas apenas para isolamento rígido (limites de segurança) ou configurações muito diferentes que não devem ser compartilhadas.
  </Accordion>

  <Accordion title="Há alguma vantagem em usar um Node no meu notebook pessoal em vez de SSH a partir de uma VPS?">
    Sim: os Nodes são a forma principal de acessar seu notebook a partir de um Gateway remoto e oferecem mais do que acesso ao shell. O Gateway é executado em macOS/Linux (Windows via WSL2) e é leve (uma pequena VPS ou um equipamento da categoria do Raspberry Pi é suficiente; 4 GB de RAM bastam), portanto uma configuração comum é um host sempre ligado mais o notebook como Node.

    - **Não requer SSH de entrada** — os Nodes se conectam ao WebSocket do Gateway por meio do emparelhamento de dispositivos.
    - **Controles de execução mais seguros** — `system.run` é controlado por listas de permissões/aprovações do Node nesse notebook.
    - **Mais ferramentas de dispositivo** — além de `system.run`, os Nodes disponibilizam `canvas`, `camera` e `screen`.
    - **Automação local do navegador** — mantenha o Gateway em uma VPS, mas execute o Chrome localmente por meio de um host de Node ou conecte-se ao Chrome local pelo Chrome MCP.

    O SSH é adequado para acesso ocasional ao shell; os Nodes são mais simples para fluxos de trabalho contínuos de agentes e automação de dispositivos.

    Documentação: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes), [Navegador](/pt-BR/tools/browser).

  </Accordion>

  <Accordion title="Os Nodes executam um serviço de Gateway?">
    Não. Apenas **um Gateway** deve ser executado por host, a menos que você execute intencionalmente perfis isolados (consulte [Vários Gateways](/pt-BR/gateway/multiple-gateways)). Os Nodes são periféricos que se conectam ao Gateway (Nodes iOS/Android ou o "modo Node" do macOS no aplicativo da barra de menus). Para hosts de Node sem interface gráfica e controle pela CLI, consulte [CLI do host de Node](/pt-BR/cli/node).

    Uma reinicialização completa é necessária para `gateway`, `discovery` e alterações nas superfícies de plugins hospedados.

  </Accordion>

  <Accordion title="Existe uma forma de aplicar a configuração por API/RPC?">
    Sim:

    - `config.schema.lookup`: inspeciona uma subárvore de configuração com seu nó de esquema superficial, a dica de UI correspondente e resumos dos filhos imediatos antes da gravação.
    - `config.get`: busca o snapshot atual e o hash.
    - `config.patch`: atualização parcial segura (preferida para a maioria das edições via RPC); recarrega a quente quando possível e reinicia quando necessário.
    - `config.apply`: valida e substitui toda a configuração; recarrega a quente quando possível e reinicia quando necessário.
    - A ferramenta de runtime `gateway` voltada para agentes ainda se recusa a reescrever `tools.exec.ask` / `tools.exec.security`; aliases legados de `tools.bash.*` são normalizados para os mesmos caminhos protegidos.

  </Accordion>

  <Accordion title="Configuração mínima adequada para uma primeira instalação">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Define o espaço de trabalho e restringe quem pode acionar o bot.

  </Accordion>

  <Accordion title="Como configuro o Tailscale em um VPS e me conecto pelo Mac?">
    1. **Instale e faça login no VPS**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. **Instale e faça login no Mac** usando o aplicativo Tailscale, na mesma tailnet.
    3. **Ative o MagicDNS** no console de administração do Tailscale para que o VPS tenha um nome estável.
    4. **Use o nome do host da tailnet**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`; WS do Gateway `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    Para usar a UI de Controle sem SSH, use o Tailscale Serve no VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Isso mantém o Gateway vinculado ao loopback e expõe HTTPS por meio do Tailscale. Consulte [Tailscale](/pt-BR/gateway/tailscale).

  </Accordion>

  <Accordion title="Como conecto um Node do Mac a um Gateway remoto (Tailscale Serve)?">
    O Serve expõe a **UI de Controle + WS do Gateway**; os Nodes se conectam pelo mesmo endpoint WS do Gateway.

    1. Verifique se o VPS e o Mac estão na mesma tailnet.
    2. Use o aplicativo para macOS no modo Remoto (o destino SSH pode ser o nome do host da tailnet) — ele cria um túnel para a porta do Gateway e se conecta como um Node.
    3. Aprove o Node:
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentação: [Protocolo do Gateway](/pt-BR/gateway/protocol), [Descoberta](/pt-BR/gateway/discovery), [modo remoto do macOS](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo instalar em um segundo notebook ou apenas adicionar um Node?">
    Para usar **somente ferramentas locais** (tela/câmera/execução) no segundo notebook, adicione-o como um **Node** — um único Gateway, sem configuração duplicada. No momento, as ferramentas locais de Node estão disponíveis somente no macOS. Instale um segundo Gateway apenas para obter **isolamento rígido** ou dois bots completamente separados.

    Documentação: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes), [Vários gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente e carregamento de .env

<AccordionGroup>
  <Accordion title="Como o OpenClaw carrega variáveis de ambiente?">
    O OpenClaw lê as variáveis de ambiente do processo pai (shell, launchd/systemd, CI etc.) e também carrega:

    - `.env` do diretório de trabalho atual.
    - um fallback global `.env` de `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`).

    Nenhum dos arquivos `.env` substitui variáveis de ambiente existentes. As chaves de credenciais de provedores e de roteamento de endpoints são uma exceção para o `.env` do espaço de trabalho: chaves como `GEMINI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY` ou qualquer chave terminada em `_ENDPOINT` (e outras variáveis de ambiente de autenticação ou endpoint de provedores incluídos) são ignoradas no `.env` do espaço de trabalho e devem ficar no ambiente do processo, em `~/.openclaw/.env` ou na configuração `env`.

    As variáveis de ambiente inline na configuração são aplicadas somente quando estiverem ausentes do ambiente do processo:

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Consulte [/environment](/pt-BR/help/environment) para ver todas as fontes e a ordem completa de precedência.

  </Accordion>

  <Accordion title="Iniciei o Gateway pelo serviço e minhas variáveis de ambiente desapareceram. E agora?">
    Há duas soluções:

    1. Coloque as chaves ausentes em `~/.openclaw/.env` para que sejam carregadas mesmo quando o serviço não herdar o ambiente do shell.
    2. Ative a importação do shell (recurso opcional de conveniência):
       ```json5
       {
         env: {
           shellEnv: {
             enabled: true,
             timeoutMs: 15000,
           },
         },
       }
       ```
       Isso executa o shell de login e importa somente as chaves esperadas ausentes (nunca substitui as existentes). Variáveis de ambiente equivalentes: `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Defini COPILOT_GITHUB_TOKEN, mas o status dos modelos mostra "Shell env: off." Por quê?'>
    `openclaw models status` informa se a **importação do ambiente do shell** está ativada. "Shell env: off" **não** significa que suas variáveis de ambiente estão ausentes — significa apenas que o OpenClaw não carregará automaticamente seu shell de login.

    Se o Gateway for executado como um serviço (launchd/systemd), ele não herdará o ambiente do shell. Para corrigir, coloque o token em `~/.openclaw/.env`, ative `env.shellEnv.enabled: true` ou adicione-o à configuração `env` (aplicada somente se estiver ausente), depois reinicie o Gateway e verifique novamente:

    ```bash
    openclaw models status
    ```

    Os tokens do Copilot são resolvidos nesta ordem: `OPENCLAW_GITHUB_TOKEN`, depois `COPILOT_GITHUB_TOKEN`, depois `GH_TOKEN` e, por fim, `GITHUB_TOKEN`.

    Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) e [/environment](/pt-BR/help/environment).

  </Accordion>
</AccordionGroup>

## Sessões e vários chats

<AccordionGroup>
  <Accordion title="Como inicio uma nova conversa?">
    Envie `/new` ou `/reset` como uma mensagem independente. Consulte [Gerenciamento de sessões](/pt-BR/concepts/session).
  </Accordion>

  <Accordion title="As sessões são redefinidas automaticamente se eu nunca enviar /new?">
    Sim. A política de redefinição padrão é **diária**: uma sessão é renovada em uma hora local configurada no host do Gateway (`session.reset.atHour`, padrão `4`, 0-23), com base no momento em que a sessão atual foi iniciada. Para usar uma redefinição baseada em inatividade, configure `mode: "idle"` e `session.reset.idleMinutes`, que encerram uma sessão após um período de inatividade (com base na última interação real, não em eventos de sistema de Heartbeat/Cron/execução).

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType` oferece suporte a `direct` (alias legado `dm`), `group` e `thread`. A opção legada de nível superior `session.idleMinutes` ainda funciona como um alias de compatibilidade para um padrão no modo de inatividade quando nenhum bloco `session.reset`/`resetByType` está definido. Sessões com uma sessão de CLI ativa pertencente ao provedor não são encerradas pela configuração diária padrão implícita. Consulte [Gerenciamento de sessões](/pt-BR/concepts/session) para ver o ciclo de vida completo.

  </Accordion>

  <Accordion title="É possível criar uma equipe de instâncias do OpenClaw (um CEO e vários agentes)?">
    Sim, por meio de **roteamento multiagente** e **subagentes**: um agente coordenador e vários agentes executores com seus próprios espaços de trabalho e modelos.

    É melhor considerar isso um experimento divertido — consome muitos tokens e costuma ser menos eficiente do que um único bot com sessões separadas. O modelo típico consiste em um bot com o qual se interage, usando diferentes sessões para trabalhos paralelos e criando subagentes quando necessário.

    Documentação: [Roteamento multiagente](/pt-BR/concepts/multi-agent), [Subagentes](/pt-BR/tools/subagents), [CLI de agentes](/pt-BR/cli/agents).

  </Accordion>

  <Accordion title="Por que o contexto foi truncado no meio de uma tarefa? Como posso evitar isso?">
    O contexto da sessão é limitado pela janela do modelo. Conversas longas, saídas extensas de ferramentas ou muitos arquivos podem acionar Compaction ou truncamento.

    - Peça ao bot para resumir o estado atual e gravá-lo em um arquivo.
    - Use `/compact` antes de tarefas longas e `/new` ao mudar de assunto.
    - Mantenha o contexto importante no espaço de trabalho e peça ao bot para lê-lo novamente.
    - Use subagentes para trabalhos longos ou paralelos, mantendo o chat principal menor.
    - Escolha um modelo com uma janela de contexto maior se isso ocorrer com frequência.

  </Accordion>

  <Accordion title="Como redefino completamente o OpenClaw sem desinstalá-lo?">
    ```bash
    openclaw reset
    ```

    Redefinição completa não interativa:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Depois, execute novamente a configuração:

    ```bash
    openclaw onboard --install-daemon
    ```

    A integração inicial também oferece **Redefinir** quando detecta uma configuração existente; consulte [Integração inicial (CLI)](/pt-BR/start/wizard). Se tiver usado perfis (`--profile` / `OPENCLAW_PROFILE`), redefina cada diretório de estado (padrão `~/.openclaw-<profile>`). Redefinição exclusiva para desenvolvimento: `openclaw gateway --dev --reset` apaga a configuração de desenvolvimento, as credenciais, as sessões e o espaço de trabalho.

  </Accordion>

  <Accordion title='Estou recebendo erros de "context too large" — como redefino ou faço a compactação?'>
    - **Compactar** (mantém a conversa e resume as interações anteriores): `/compact` ou `/compact <instructions>` para orientar o resumo.
    - **Redefinir** (novo ID de sessão para a mesma chave de chat): `/new` ou `/reset`.

    Se isso continuar acontecendo, ajuste a **limpeza da sessão** (`agents.defaults.contextPruning`) para remover saídas antigas de ferramentas ou use um modelo com uma janela de contexto maior.

    Documentação: [Compaction](/pt-BR/concepts/compaction), [Limpeza da sessão](/pt-BR/concepts/session-pruning), [Gerenciamento de sessões](/pt-BR/concepts/session).

  </Accordion>

  <Accordion title='Por que estou vendo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Erro de validação do provedor: o modelo emitiu um bloco `tool_use` sem o `input` obrigatório. Isso geralmente significa que o histórico da sessão está desatualizado ou corrompido (frequentemente após conversas longas ou uma alteração de ferramenta/esquema).

    Correção: inicie uma nova sessão com `/new` (mensagem independente).

  </Accordion>

  <Accordion title="Por que estou recebendo mensagens de Heartbeat a cada 30 minutos?">
    Por padrão, os Heartbeats são executados a cada **30m**, ou a cada **1h** quando o modo de autenticação resolvido é OAuth/autenticação por token da Anthropic (incluindo a reutilização da CLI do Claude) e `heartbeat.every` não está definido. Ajuste ou desative:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // ou "0m" para desativar
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` existir, mas estiver efetivamente vazio (apenas linhas em branco, comentários Markdown/HTML, cabeçalhos ATX, marcadores de cercas ou itens de lista vazios), o OpenClaw ignora a execução do Heartbeat para economizar chamadas de API. Se o arquivo estiver ausente, o Heartbeat ainda será executado e o modelo decidirá o que fazer.

    As substituições por agente usam `agents.list[].heartbeat`. Documentação: [Heartbeat](/pt-BR/gateway/heartbeat).

  </Accordion>

  <Accordion title='Preciso adicionar uma "conta de bot" a um grupo do WhatsApp?'>
    Não. O OpenClaw é executado na **sua própria conta** — se a conta estiver no grupo, o OpenClaw poderá vê-lo. Por padrão, as respostas em grupo ficam bloqueadas até que os remetentes sejam permitidos (`groupPolicy: "allowlist"`).

    Para restringir as respostas no grupo somente à sua conta:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Como obtenho o JID de um grupo do WhatsApp?">
    A maneira mais rápida é acompanhar os logs e enviar uma mensagem de teste no grupo.

    ```bash
    openclaw logs --follow --json
    ```

    Procure por `chatId` (ou `from`) terminado em `@g.us`, como `1234567890-1234567890@g.us`.

    Se já estiver configurado/incluído na lista de permissões, liste os grupos pela configuração:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentação: [WhatsApp](/pt-BR/channels/whatsapp), [Diretório](/pt-BR/cli/directory), [Logs](/pt-BR/cli/logs).

  </Accordion>

  <Accordion title="Por que o OpenClaw não responde em um grupo?">
    Duas causas comuns: a exigência de menção fica ativada por padrão (é necessário @mencionar o bot ou corresponder a `mentionPatterns`) ou `channels.whatsapp.groups` foi configurado sem `"*"` e o grupo não está na lista de permissões.

    Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).

  </Accordion>

  <Accordion title="Grupos/threads compartilham contexto com mensagens diretas?">
    Por padrão, conversas diretas são consolidadas na sessão principal. Grupos/canais têm suas próprias chaves de sessão, e tópicos do Telegram/threads do Discord são sessões separadas. Consulte [Grupos](/pt-BR/channels/groups) e [Mensagens de grupo](/pt-BR/channels/group-messages).
  </Accordion>

  <Accordion title="Quantos espaços de trabalho e agentes posso criar?">
    Não há limites rígidos — dezenas ou até centenas funcionam bem, mas observe:

    - **Crescimento do disco**: sessões ativas e transcrições ficam no banco de dados SQLite de cada agente; artefatos legados/de arquivamento ainda podem se acumular em `~/.openclaw/agents/<agentId>/sessions/`.
    - **Custo de tokens**: mais agentes significam mais uso simultâneo de modelos.
    - **Sobrecarga operacional**: perfis de autenticação, espaços de trabalho e roteamento de canais por agente.

    Mantenha um espaço de trabalho **ativo** por agente (`agents.defaults.workspace`), remova sessões antigas com `openclaw sessions cleanup` se o uso do disco aumentar (não edite manualmente o estado SQLite ativo) e use `openclaw doctor` para identificar espaços de trabalho avulsos e incompatibilidades de perfis.

  </Accordion>

  <Accordion title="Posso executar vários bots ou chats ao mesmo tempo (Slack) e como devo configurar isso?">
    Sim, por meio do **Roteamento Multiagente**: execute vários agentes isolados e roteie mensagens recebidas por canal/conta/par. O Slack é compatível como canal e pode ser vinculado a agentes específicos.

    O acesso ao navegador é poderoso, mas não permite "fazer qualquer coisa que uma pessoa possa fazer" — mecanismos antibot, CAPTCHAs e MFA ainda podem bloquear a automação. Para obter o controle mais confiável, use o MCP local do Chrome no host ou CDP na máquina que realmente executa o navegador.

    Configuração recomendada: host do Gateway sempre ativo (VPS/Mac mini), um agente por função (vinculações), canais do Slack vinculados a esses agentes e navegador local por meio do MCP do Chrome ou de um Node quando necessário.

    Documentação: [Roteamento Multiagente](/pt-BR/concepts/multi-agent), [Slack](/pt-BR/channels/slack), [Navegador](/pt-BR/tools/browser), [Nodes](/pt-BR/nodes).

  </Accordion>
</AccordionGroup>

## Modelos, failover e perfis de autenticação

As perguntas e respostas sobre modelos — padrões, seleção, aliases, alternância, failover e perfis de autenticação — estão nas [Perguntas frequentes sobre modelos](/pt-BR/help/faq-models).

## Gateway: portas, "já está em execução" e modo remoto

<AccordionGroup>
  <Accordion title="Qual porta o Gateway usa?">
    `gateway.port` controla a única porta multiplexada para WebSocket + HTTP (Interface de Controle, hooks etc.). Precedência:

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > padrão 18789
    ```

  </Accordion>

  <Accordion title='Por que openclaw gateway status informa "Runtime: running", mas "Connectivity probe: failed"?'>
    "Running" é a visão do **supervisor** (launchd/systemd/schtasks); a sondagem de conectividade é a CLI realmente se conectando ao WebSocket do Gateway. Considere estas linhas de `openclaw gateway status`: `Probe target:` (a URL usada pela sondagem), `Listening:` (o que está realmente vinculado à porta), `Last gateway error:` (causa raiz comum quando o processo está ativo, mas a porta não está escutando).
  </Accordion>

  <Accordion title='Por que openclaw gateway status mostra valores diferentes para "Config (cli)" e "Config (service)"?'>
    Um arquivo de configuração está sendo editado enquanto o serviço executa outro (geralmente uma incompatibilidade entre `--profile` e `OPENCLAW_STATE_DIR`).

    Para corrigir, execute no mesmo `--profile`/ambiente que o serviço deve usar:

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='O que significa "another gateway instance is already listening"?'>
    O OpenClaw impõe um bloqueio de runtime vinculando o listener WebSocket imediatamente na inicialização (padrão: `ws://127.0.0.1:18789`). Se a vinculação falhar com `EADDRINUSE`, ele gera `GatewayLockError` ("another gateway instance is already listening").

    Correção: interrompa a outra instância, libere a porta ou execute com `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Como executo o OpenClaw no modo remoto (o cliente se conecta a um Gateway em outro lugar)?">
    Defina `gateway.mode: "remote"` e aponte para uma URL WebSocket remota, opcionalmente com credenciais remotas de segredo compartilhado:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    - `openclaw gateway` só é iniciado quando `gateway.mode` é `local` (ou quando uma flag de substituição é fornecida).
    - O aplicativo para macOS monitora o arquivo de configuração e alterna os modos em tempo real quando esses valores mudam.
    - `gateway.remote.token`/`.password` são apenas credenciais remotas do lado do cliente; por si só, elas não habilitam a autenticação do Gateway local.

  </Accordion>

  <Accordion title='A Interface de Controle informa "unauthorized" (ou continua se reconectando). O que fazer?'>
    O caminho de autenticação do Gateway e o método de autenticação da interface não correspondem.

    Fatos (com base no código):

    - A Interface de Controle mantém o token em `sessionStorage`, com escopo limitado à aba atual do navegador e à URL selecionada do Gateway, portanto, atualizações na mesma aba continuam funcionando sem a persistência prolongada do token no localStorage.
    - Em `AUTH_TOKEN_MISMATCH`, clientes confiáveis podem fazer uma única tentativa adicional limitada com um token de dispositivo em cache quando o Gateway retorna indicações para nova tentativa (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Essa nova tentativa com o token em cache reutiliza os escopos aprovados armazenados com o token do dispositivo; chamadores com `deviceToken` explícito/`scopes` explícito mantêm o conjunto de escopos solicitado, em vez de herdar os escopos em cache.
    - Fora desse caminho de nova tentativa, a precedência da autenticação de conexão é: primeiro token/senha compartilhado explícito, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de bootstrap.
    - O bootstrap integrado por código de configuração retorna um token de dispositivo Node com `scopes: []`, além de um token de transferência de operador limitado para integração móvel confiável. A transferência de operador pode ler a configuração nativa do momento da configuração, mas não concede escopos de alteração de emparelhamento nem `operator.admin`.

    Correção:

    - Mais rápido: `openclaw dashboard` (exibe + copia a URL do painel e tenta abri-la; mostra uma dica de SSH se não houver interface gráfica).
    - Ainda não há token: `openclaw doctor --generate-gateway-token`.
    - Remoto: primeiro crie um túnel com `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`.
    - Modo de segredo compartilhado: defina `gateway.auth.token`/`OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password`/`OPENCLAW_GATEWAY_PASSWORD` e cole o segredo correspondente nas configurações da Interface de Controle.
    - Modo Tailscale Serve: confirme que `gateway.auth.allowTailscale` está habilitado e que a URL do Serve está sendo aberta, não uma URL bruta de loopback/tailnet que ignore os cabeçalhos de identidade do Tailscale.
    - Modo de proxy confiável: confirme que o acesso ocorre por meio do proxy configurado com reconhecimento de identidade. Proxies de loopback no mesmo host também precisam de `gateway.auth.trustedProxy.allowLoopback = true`.
    - A incompatibilidade persiste após a única nova tentativa: altere/aprove novamente o token do dispositivo emparelhado:
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - Alteração negada: sessões de dispositivos emparelhados só podem alterar o token de seu **próprio** dispositivo, a menos que também tenham `operator.admin`, e valores explícitos de `--scope` não podem exceder os escopos de operador atuais do chamador.
    - O problema persiste: `openclaw status --all` e [Solução de problemas](/pt-BR/gateway/troubleshooting). Consulte [Painel](/pt-BR/web/dashboard) para obter detalhes de autenticação.

  </Accordion>

  <Accordion title="Defini gateway.bind como tailnet, mas ele escuta apenas no loopback">
    A vinculação `tailnet` seleciona um IP do Tailscale nas interfaces de rede (100.64.0.0/10). Se a máquina não estiver no Tailscale (ou a interface estiver inativa), o Gateway usará o loopback como alternativa, em vez de expor outra interface de rede.

    Correção: inicie o Tailscale nesse host e reinicie o Gateway ou alterne explicitamente para `gateway.bind: "loopback"`/`"lan"`.

    `tailnet` é explícito; `auto` prioriza o loopback. Use `gateway.bind: "tailnet"` para limitar a exposição fora do loopback à Tailnet, mantendo o listener `127.0.0.1` obrigatório no mesmo host.

  </Accordion>

  <Accordion title="Posso executar vários Gateways no mesmo host?">
    Em geral, não — um Gateway pode executar vários canais de mensagens e agentes. Use vários Gateways somente para redundância (por exemplo, um bot de recuperação) ou isolamento rígido e isole cada um com seu próprio `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace` e `gateway.port` exclusivo.

    Recomendação: `openclaw --profile <name> ...` por instância (cria `~/.openclaw-<name>` automaticamente), um `gateway.port` exclusivo por configuração de perfil (ou `--port` para execuções manuais) e um serviço por perfil com `openclaw --profile <name> gateway install`.

    Os perfis também adicionam sufixos aos nomes dos serviços: launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. A unidade systemd não qualificada `openclaw-gateway` existe somente para o perfil padrão; o nome legado da unidade systemd anterior à renomeação, `clawdbot-gateway`, é migrado automaticamente.

    Guia completo: [Vários gateways](/pt-BR/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='O que significa "invalid handshake"/código 1008?'>
    O Gateway é um **servidor WebSocket** e espera que a primeira mensagem seja um frame `connect`. Qualquer outra coisa encerra a conexão com o **código 1008** (violação de política).

    Causas comuns: a URL **HTTP** foi aberta em um navegador em vez de um cliente WS, a porta/o caminho incorreto foi usado ou um proxy/túnel removeu os cabeçalhos de autenticação ou enviou uma solicitação que não era do Gateway.

    Correção: use a URL WS (`ws://<host>:18789` ou `wss://...` sobre HTTPS), não abra a porta WS em uma aba normal do navegador e inclua o token/a senha no frame `connect` quando a autenticação estiver ativada. Exemplo de CLI/TUI:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Detalhes do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Registro em logs e depuração

<AccordionGroup>
  <Accordion title="Onde ficam os logs?">
    Logs de arquivo (estruturados): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. Defina um caminho estável por meio de `logging.file`; o nível de log do arquivo por meio de `logging.level`; e a verbosidade do console por meio de `--verbose` e `logging.consoleLevel`.

    Forma mais rápida de acompanhar:

    ```bash
    openclaw logs --follow
    ```

    Logs do serviço/supervisor (quando o Gateway é executado por meio de launchd/systemd):

    - stdout do launchd no macOS: `~/Library/Logs/openclaw/gateway.log` (os perfis usam `gateway-<profile>.log`; stderr é suprimido).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    Consulte [Solução de problemas](/pt-BR/gateway/troubleshooting) para saber mais.

  </Accordion>

  <Accordion title="Como inicio/interrompo/reinicio o serviço do Gateway?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se o Gateway for executado manualmente, `openclaw gateway --force` poderá recuperar a porta. Consulte [Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Fechei meu terminal no Windows — como reinicio o OpenClaw?">
    Três modos de instalação no Windows:

    **1) Configuração local do Windows Hub**: o aplicativo nativo gerencia um Gateway WSL local pertencente ao aplicativo. Abra **OpenClaw Companion** pelo menu Iniciar ou pela bandeja e use **Gateway Setup** ou a aba Connections.

    **2) Gateway WSL2 manual**: o Gateway é executado dentro do Linux.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    Se o serviço nunca foi instalado, inicie-o em primeiro plano: `openclaw gateway run`.

    **3) CLI/Gateway nativo do Windows**: é executado diretamente no Windows.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    Se for executado manualmente (sem serviço): `openclaw gateway run`.

    Documentação: [Windows](/pt-BR/platforms/windows), [Manual operacional do serviço Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="O Gateway está ativo, mas as respostas nunca chegam. O que devo verificar?">
    Verificação rápida de integridade:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causas comuns: autenticação do modelo não carregada no **host do Gateway** (verifique `models status`), pareamento/lista de permissões do canal bloqueando respostas (verifique a configuração e os logs do canal) ou WebChat/Painel aberto sem o token correto. Em acesso remoto, confirme se a conexão do túnel/Tailscale está ativa e se o WebSocket do Gateway está acessível.

    Documentação: [Canais](/pt-BR/channels), [Solução de problemas](/pt-BR/gateway/troubleshooting), [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title='"Desconectado do Gateway: nenhum motivo" — e agora?'>
    Geralmente significa que a interface perdeu a conexão WebSocket. Verifique: o Gateway está em execução (`openclaw gateway status`)? Está íntegro (`openclaw status`)? A interface tem o token correto (`openclaw dashboard`)? Em acesso remoto, o link do túnel/Tailscale está ativo?

    Em seguida, acompanhe os logs:

    ```bash
    openclaw logs --follow
    ```

    Documentação: [Painel](/pt-BR/web/dashboard), [Acesso remoto](/pt-BR/gateway/remote), [Solução de problemas](/pt-BR/gateway/troubleshooting).

  </Accordion>

  <Accordion title="O setMyCommands do Telegram falha. O que devo verificar?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Em seguida, identifique o erro:

    - `BOT_COMMANDS_TOO_MUCH`: o menu do Telegram tem entradas demais. O OpenClaw já reduz o menu ao limite do Telegram e tenta novamente com menos comandos, mas algumas entradas ainda podem ser descartadas. Reduza os comandos de plugins/Skills/personalizados ou desative `channels.telegram.commands.native` caso não precise do menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` ou erros de rede semelhantes: em um VPS ou atrás de um proxy, confirme se conexões HTTPS de saída são permitidas e se o DNS funciona para `api.telegram.org`.

    Se o Gateway for remoto, verifique os logs no host do Gateway.

    Documentação: [Telegram](/pt-BR/channels/telegram), [Solução de problemas de canais](/pt-BR/channels/troubleshooting).

  </Accordion>

  <Accordion title="A TUI não exibe nenhuma saída. O que devo verificar?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Na TUI, use `/status` para ver o estado atual. Se forem esperadas respostas em um canal de chat, confirme se a entrega está habilitada (`/deliver on`).

    Documentação: [TUI](/pt-BR/web/tui), [Comandos de barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title="Como interromper completamente e depois iniciar o Gateway?">
    Se o serviço foi instalado (launchd no macOS, systemd no Linux):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Em primeiro plano, interrompa com Ctrl-C e depois execute `openclaw gateway run`.

    Documentação: [Manual operacional do serviço Gateway](/pt-BR/gateway).

  </Accordion>

  <Accordion title="Explicação simples: openclaw gateway restart vs. openclaw gateway">
    `openclaw gateway restart` reinicia o **serviço em segundo plano** (launchd/systemd). `openclaw gateway` executa o Gateway **em primeiro plano** durante esta sessão do terminal. Use os subcomandos do Gateway se o serviço foi instalado; use a execução direta em primeiro plano para uma execução avulsa.
  </Accordion>

  <Accordion title="Forma mais rápida de obter mais detalhes quando algo falha">
    Inicie o Gateway com `--verbose` para obter mais detalhes no console e depois inspecione o arquivo de log em busca de erros de autenticação do canal, roteamento de modelos e RPC.
  </Accordion>
</AccordionGroup>

## Mídia e anexos

<AccordionGroup>
  <Accordion title="Minha Skill gerou uma imagem/PDF, mas nada foi enviado">
    Os anexos de saída do agente devem usar campos estruturados de mídia, como `media`, `mediaUrl`, `path` ou `filePath`. Consulte [Configuração do assistente OpenClaw](/pt-BR/start/openclaw) e [Envio do agente](/pt-BR/tools/agent-send).

    ```bash
    openclaw message send --target +15555550123 --message "Aqui está" --media /path/to/file.png
    ```

    Verifique também: se o canal de destino aceita mídia de saída e não está bloqueado por listas de permissões; se o arquivo respeita os limites de tamanho do provedor (as imagens são redimensionadas para um lado máximo de 2048px); `tools.fs.workspaceOnly=true` limita os envios por caminho local ao espaço de trabalho, ao armazenamento temporário/de mídia e a arquivos validados pelo sandbox; `tools.fs.workspaceOnly=false` (padrão) permite que envios estruturados de mídia local usem arquivos locais do host que o agente já consegue ler, tanto para mídia quanto para tipos seguros de documentos (imagens, áudio, vídeo, PDF, documentos do Office e documentos de texto validados, como Markdown/MD, TXT, JSON, YAML/YML). Isso não é um scanner de segredos — um `secret.txt` ou `config.json` legível pelo agente pode ser anexado quando a extensão e a validação do conteúdo corresponderem. Mantenha arquivos confidenciais fora dos caminhos legíveis pelo agente ou mantenha `tools.fs.workspaceOnly=true` para envios por caminho local mais restritos.

    Consulte [Imagens](/pt-BR/nodes/images).

  </Accordion>
</AccordionGroup>

## Segurança e controle de acesso

<AccordionGroup>
  <Accordion title="É seguro expor o OpenClaw a mensagens diretas recebidas?">
    Trate mensagens diretas recebidas como entrada não confiável. Os padrões reduzem o risco:

    - O comportamento padrão em canais compatíveis com mensagens diretas é o **pareamento**: remetentes desconhecidos recebem um código de pareamento e suas mensagens não são processadas. Aprove com `openclaw pairing approve --channel <channel> [--account <id>] <code>`. As solicitações pendentes são limitadas a **3 por canal**; verifique `openclaw pairing list --channel <channel> [--account <id>]` se um código não chegar.
    - Abrir mensagens diretas ao público exige adesão explícita (`dmPolicy: "open"` e lista de permissões `"*"`).

    Execute `openclaw doctor` para identificar políticas arriscadas de mensagens diretas.

  </Accordion>

  <Accordion title="A injeção de prompt é uma preocupação apenas para bots públicos?">
    Não. A injeção de prompt diz respeito a **conteúdo não confiável**, não apenas a quem pode enviar mensagens diretas ao bot. Se o assistente lê conteúdo externo (pesquisa/busca na Web, páginas do navegador, e-mails, documentos, anexos ou logs colados), esse conteúdo pode conter instruções que tentam sequestrar o modelo — mesmo que você seja o único remetente.

    O maior risco ocorre quando as ferramentas estão habilitadas: o modelo pode ser induzido a exfiltrar contexto ou chamar ferramentas em seu nome. Reduza o raio de impacto:

    - use um agente "leitor" somente leitura ou sem ferramentas para resumir conteúdo não confiável
    - mantenha `web_search` / `web_fetch` / `browser` desativados para agentes com ferramentas habilitadas
    - trate também o texto decodificado de arquivos/documentos como não confiável: tanto `input_file` do OpenResponses quanto a extração de anexos de mídia envolvem o texto extraído em marcadores explícitos de limite de conteúdo externo, em vez de transmitir o texto bruto do arquivo
    - use sandbox e listas de permissões restritas para ferramentas

    Detalhes: [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="O OpenClaw é menos seguro porque usa TypeScript/Node em vez de Rust/WASM?">
    A linguagem e o runtime são importantes, mas não constituem o principal risco para um agente pessoal. Os riscos práticos são a exposição do Gateway, quem pode enviar mensagens ao bot, injeção de prompt, escopo das ferramentas, gerenciamento de credenciais, acesso ao navegador, acesso de execução e confiança em Skills/plugins de terceiros.

    Rust e WASM podem oferecer isolamento mais robusto para algumas classes de código, mas não resolvem injeção de prompt, listas de permissões inadequadas, exposição pública do Gateway, ferramentas com escopo excessivo ou um perfil de navegador já conectado a contas confidenciais. Trate estes como os controles principais: mantenha o Gateway privado ou autenticado, use pareamento e listas de permissões para mensagens diretas/grupos, negue ou execute em sandbox ferramentas arriscadas para entradas não confiáveis, instale somente plugins e Skills confiáveis e execute `openclaw security audit --deep` após alterações na configuração.

    Detalhes: [Segurança](/pt-BR/gateway/security), [Uso de sandbox](/pt-BR/gateway/sandboxing).

  </Accordion>

  <Accordion title="Vi relatos sobre instâncias expostas do OpenClaw. O que devo verificar?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Uma base mais segura: Gateway vinculado a `loopback` ou exposto somente por acesso privado autenticado (tailnet, túnel SSH, autenticação por token/senha ou um proxy confiável configurado corretamente); mensagens diretas no modo `pairing` ou `allowlist`; grupos em listas de permissões e condicionados a menções, a menos que todos os membros sejam confiáveis; ferramentas de alto risco (`exec`, `browser`, `gateway`, `cron`) negadas ou com escopo rigorosamente limitado para agentes que leem conteúdo não confiável; sandbox habilitado quando a execução de ferramentas exigir um raio de impacto menor.

    Vínculos públicos sem autenticação, mensagens diretas/grupos abertos com ferramentas e controle do navegador exposto são os problemas que devem ser corrigidos primeiro. Detalhes: [openclaw security audit](/pt-BR/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="É seguro instalar Skills do ClawHub e plugins de terceiros?">
    Trate Skills e plugins de terceiros como código no qual você está optando por confiar. As páginas de Skills do ClawHub exibem o estado da verificação antes da instalação, mas as verificações não constituem um limite de segurança completo. O OpenClaw não executa bloqueio local integrado de código perigoso durante a instalação ou atualização de plugins/Skills; use `security.installPolicy` controlado pelo operador para decisões locais de permissão/bloqueio.

    Padrão mais seguro: prefira autores confiáveis e versões fixadas, leia a Skill/o plugin antes de habilitá-lo, mantenha restritas as listas de permissões de plugins/Skills, execute fluxos de trabalho com entradas não confiáveis em um sandbox com o mínimo de ferramentas e evite conceder a código de terceiros acesso amplo ao sistema de arquivos, execução, navegador ou segredos.

    Detalhes: [Skills](/pt-BR/tools/skills), [Plugins](/pt-BR/tools/plugin), [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Meu bot deve ter seu próprio e-mail, conta do GitHub ou número de telefone?">
    Sim, para a maioria das configurações. Isolar o bot com contas e números de telefone separados reduz o raio de impacto caso algo dê errado e facilita alternar credenciais ou revogar o acesso sem afetar suas contas pessoais.

    Comece de forma limitada: conceda acesso somente às ferramentas e contas realmente necessárias e amplie-o posteriormente, se necessário.

    Documentação: [Segurança](/pt-BR/gateway/security), [Pareamento](/pt-BR/channels/pairing).

  </Accordion>

  <Accordion title="Posso conceder autonomia sobre minhas mensagens de texto? Isso é seguro?">
    **Não** recomendamos autonomia total sobre suas mensagens pessoais. O padrão mais seguro é manter as mensagens diretas no **modo de pareamento** ou em uma lista de permissões restrita, usar um **número ou uma conta separada** se o bot precisar enviar mensagens em seu nome e permitir que ele crie rascunhos enquanto você **aprova antes do envio**.

    Para experimentar, use uma conta dedicada e isolada. Consulte [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Posso usar modelos mais baratos para tarefas de assistente pessoal?">
    Sim, **se** o agente for somente de chat e a entrada for confiável. Categorias menores são mais suscetíveis ao sequestro de instruções; portanto, evite-as para agentes com ferramentas habilitadas ou ao ler conteúdo não confiável. Se for necessário usar um modelo menor, restrinja as ferramentas e execute-o dentro de um sandbox. Consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Executei /start no Telegram, mas não recebi um código de pareamento">
    Os códigos de pareamento são enviados **somente** quando um remetente desconhecido envia uma mensagem ao bot e `dmPolicy: "pairing"` está habilitado; `/start` por si só não gera um código.

    Verifique as solicitações pendentes:

    ```bash
    openclaw pairing list telegram
    ```

    Para obter acesso imediato, adicione o ID do remetente à lista de permissões ou defina `dmPolicy: "open"` para essa conta.

  </Accordion>

  <Accordion title="WhatsApp: ele enviará mensagens aos meus contatos? Como funciona o pareamento?">
    Não. A política padrão de mensagens diretas do WhatsApp é **pareamento**. Remetentes desconhecidos recebem apenas um código de pareamento; suas mensagens **não são processadas**. O OpenClaw responde somente aos chats que recebe ou a envios explícitos que você aciona.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    O prompt de número de telefone do assistente configura sua **lista de permissões/proprietário** para permitir suas próprias mensagens diretas — ele não é usado para envio automático. No seu número pessoal do WhatsApp, use esse número e habilite `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandos de chat, cancelamento de tarefas e "não para"

<AccordionGroup>
  <Accordion title="Como impedir que mensagens internas do sistema apareçam no chat?">
    A maioria das mensagens internas/de ferramentas só aparece quando **detalhado**, **rastreamento** ou **raciocínio** está habilitado para essa sessão.

    Corrija no chat em que elas aparecem:

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    Se ainda houver muitas mensagens: verifique as configurações da sessão na interface de controle e defina o modo detalhado como **herdar**; confirme que não está usando um perfil de bot com `verboseDefault: "on"` na configuração.

    Documentação: [Raciocínio e modo detalhado](/pt-BR/tools/thinking), [Segurança](/pt-BR/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Como interromper/cancelar uma tarefa em execução?">
    Envie qualquer uma destas opções **como uma mensagem separada** (sem barra) para acionar um cancelamento: `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. Acionadores comuns em outros idiomas (francês, alemão, espanhol, chinês, japonês, hindi, árabe e russo) também funcionam.

    Para processos em segundo plano iniciados pela ferramenta exec, peça ao agente para executar:

    ```text
    process action:kill sessionId:XXX
    ```

    A maioria dos comandos com barra deve ser enviada como uma mensagem **separada** começando com `/`, mas alguns atalhos (como `/status`) também funcionam em linha para remetentes incluídos na lista de permissões. Consulte [Comandos com barra](/pt-BR/tools/slash-commands).

  </Accordion>

  <Accordion title='Como enviar uma mensagem do Discord pelo Telegram? ("Mensagens entre contextos negadas")'>
    Por padrão, o OpenClaw bloqueia mensagens **entre provedores**. Se uma chamada de ferramenta estiver vinculada ao Telegram, ela não enviará mensagens ao Discord, a menos que isso seja permitido explicitamente — e a alteração entra em vigor imediatamente, sem necessidade de reiniciar o Gateway:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[de {channel}] " },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title='Por que parece que o bot "ignora" mensagens enviadas em rápida sequência?'>
    Por padrão, os prompts enviados durante uma execução são direcionados para a execução ativa. Use `/queue` para escolher o comportamento da execução ativa:

    - `steer` (padrão) — orienta a execução ativa no próximo limite do modelo.
    - `followup` — coloca as mensagens na fila e as executa uma por vez após o término da execução atual.
    - `collect` — coloca mensagens compatíveis na fila e responde uma única vez após o término da execução atual.
    - `interrupt` — cancela a execução atual e inicia uma nova.

    Adicione opções aos modos de fila, como `debounce:0.5s cap:25 drop:summarize`. Consulte [Fila de comandos](/pt-BR/concepts/queue) e [Fila de direcionamento](/pt-BR/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Diversos

<AccordionGroup>
  <Accordion title='Qual é o modelo padrão da Anthropic com uma chave de API?'>
    As credenciais e a seleção do modelo são independentes. Definir `ANTHROPIC_API_KEY` (ou armazenar uma chave de API da Anthropic nos perfis de autenticação) habilita a autenticação, mas o modelo padrão efetivo é aquele configurado em `agents.defaults.model.primary` (por exemplo, `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"` significa que o Gateway não conseguiu encontrar as credenciais da Anthropic no `auth-profiles.json` esperado para o agente em execução.
  </Accordion>
</AccordionGroup>

---

Ainda com dificuldades? Pergunte em [Discord](https://discord.com/invite/clawd) ou abra uma [discussão no GitHub](https://github.com/openclaw/openclaw/discussions).

## Relacionados

- [Perguntas frequentes sobre a primeira execução](/pt-BR/help/faq-first-run) — instalação, integração inicial, autenticação, assinaturas e falhas iniciais
- [Perguntas frequentes sobre modelos](/pt-BR/help/faq-models) — seleção de modelo, failover e perfis de autenticação
- [Solução de problemas](/pt-BR/help/troubleshooting) — triagem baseada primeiro nos sintomas
