---
read_when:
    - Nova instalação, integração travada ou erros na primeira execução
    - Escolhendo assinaturas de autenticação e de provedores
    - Não é possível acessar docs.openclaw.ai, não é possível abrir o painel, instalação travada
sidebarTitle: First-run FAQ
summary: 'Perguntas frequentes: início rápido e configuração da primeira execução — instalação, integração inicial, autenticação, assinaturas e falhas iniciais'
title: 'Perguntas frequentes: configuração inicial'
x-i18n:
    generated_at: "2026-07-12T15:19:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8f5234a5ae52fd57a89b3140473049c37f8495875e4a5d9a89d87e55d8fb2f7e
    source_path: help/faq-first-run.md
    workflow: 16
---

  Guia de início rápido e perguntas e respostas da primeira execução. Para operações cotidianas, modelos, autenticação, sessões
  e solução de problemas, consulte as principais [Perguntas frequentes](/pt-BR/help/faq).

  ## Início rápido e configuração da primeira execução

  <AccordionGroup>
  <Accordion title="Estou com dificuldades; qual é a maneira mais rápida de resolvê-las?">
    Use um agente de IA local que possa **ver sua máquina**. A maioria dos casos de "estou com dificuldades"
    envolve **problemas locais de configuração ou ambiente** que um assistente remoto não consegue inspecionar; portanto, isso é melhor do que
    pedir ajuda no Discord.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Forneça ao agente o checkout completo do código-fonte por meio da instalação modificável (git), para que ele possa ler
    o código e a documentação e analisar a versão exata que você executa:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Peça ao agente que planeje e supervisione a correção passo a passo e, depois, execute apenas os
    comandos necessários — diffs menores são mais fáceis de auditar.

    Compartilhe estas saídas ao pedir ajuda (no Discord ou em uma issue do GitHub):

    | Comando | Mostra |
    | --- | --- |
    | `openclaw status` | Integridade do Gateway/agente + instantâneo básico da configuração |
    | `openclaw status --all` | Diagnóstico completo somente leitura, pronto para colar |
    | `openclaw models status` | Autenticação do provedor + disponibilidade dos modelos |
    | `openclaw doctor` | Valida e corrige problemas comuns de configuração/estado |
    | `openclaw logs --follow` | Acompanhamento dos logs em tempo real |
    | `openclaw gateway status --deep` | Verificação aprofundada da integridade do Gateway/configuração/plugin |
    | `openclaw health --verbose` | Relatório detalhado de integridade |

    Encontrou um bug real ou uma correção? Abra uma issue ou envie um PR:
    [Issues](https://github.com/openclaw/openclaw/issues) /
    [Pull requests](https://github.com/openclaw/openclaw/pulls).

    Ciclo rápido de depuração: [Primeiros 60 segundos se algo não estiver funcionando](/pt-BR/help/faq#first-60-seconds-if-something-is-broken).
    Documentação de instalação: [Instalação](/pt-BR/install), [Opções do instalador](/pt-BR/install/installer), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O Heartbeat continua sendo ignorado. O que significam os motivos?">
    | Motivo | Significado |
    | --- | --- |
    | `quiet-hours` | Fora da janela de horário ativo configurada |
    | `empty-heartbeat-file` | `HEARTBEAT.md` existe, mas contém apenas estruturas vazias, em branco, de comentários, cabeçalhos, cercas ou listas de verificação |
    | `no-tasks-due` | O modo de tarefas está ativo, mas nenhum intervalo de tarefa venceu ainda |
    | `alerts-disabled` | Toda a visibilidade do Heartbeat está desativada (`showOk`, `showAlerts` e `useIndicator` estão desativados) |

    No modo de tarefas, os carimbos de data e hora de vencimento avançam somente depois que uma execução real do Heartbeat é concluída.
    Execuções ignoradas não marcam as tarefas como concluídas.

    Documentação: [Heartbeat](/pt-BR/gateway/heartbeat), [Automação](/pt-BR/automation).

  </Accordion>

  <Accordion title="Forma recomendada de instalar e configurar o OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    A partir do código-fonte (colaboradores/desenvolvedores):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Ainda não há uma instalação global? Execute `pnpm openclaw onboard`. Se os recursos da Control UI
    estiverem ausentes, a integração inicial tentará compilá-los, recorrendo a `pnpm ui:build` se necessário.

  </Accordion>

  <Accordion title="Como abro o painel depois da integração inicial?">
    A integração inicial abre seu navegador em uma URL limpa (sem token) do painel logo após
    a configuração e exibe o link no resumo. Mantenha essa guia aberta; se ela não for iniciada,
    copie e cole a URL exibida na mesma máquina.
  </Accordion>

  <Accordion title="Como autentico o painel no localhost e remotamente?">
    **Localhost (mesma máquina):**

    - Abra `http://127.0.0.1:18789/`.
    - Se for solicitada autenticação por segredo compartilhado, cole o token ou a senha configurada nas configurações da Control UI.
    - Origem do token: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Origem da senha: `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Ainda não há um segredo compartilhado configurado? Execute `openclaw doctor --generate-gateway-token` (ou `openclaw doctor --fix --generate-gateway-token`).

    **Fora do localhost:**

    - **Tailscale Serve** (recomendado): mantenha o vínculo com loopback, execute `openclaw gateway --tailscale serve` e abra `https://<magicdns>/`. Com `gateway.auth.allowTailscale: true`, os cabeçalhos de identidade atendem à autenticação da Control UI/WebSocket (sem colar um segredo compartilhado; pressupõe um host de Gateway confiável); as APIs HTTP ainda exigem autenticação por segredo compartilhado, a menos que você use deliberadamente `none` para ingresso privado ou autenticação HTTP por proxy confiável.
      Tentativas simultâneas de autenticação inválida no Serve, provenientes do mesmo cliente, são serializadas antes que o limitador de falhas de autenticação as registre; portanto, uma segunda tentativa inválida já pode exibir `retry later`.
    - **Vínculo com a tailnet**: execute `openclaw gateway --bind tailnet --token "<token>"` (ou configure a autenticação por senha), abra `http://<tailscale-ip>:18789/` e cole o segredo compartilhado correspondente nas configurações do painel.
    - **Proxy reverso com reconhecimento de identidade**: mantenha o Gateway atrás de um proxy confiável, defina `gateway.auth.mode: "trusted-proxy"` e abra a URL do proxy. Proxies de loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback: true` explicitamente.
    - **Túnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` e, depois, abra `http://127.0.0.1:18789/`. A autenticação por segredo compartilhado ainda se aplica por meio do túnel; cole o token ou a senha configurada se solicitado.

    Consulte [Painel](/pt-BR/web/dashboard) e [Superfícies web](/pt-BR/web) para obter detalhes sobre modos de vínculo e autenticação.

  </Accordion>

  <Accordion title="Por que existem duas configurações de aprovação de exec para aprovações pelo chat?">
    Elas controlam camadas diferentes:

    - `approvals.exec` — encaminha solicitações de aprovação para destinos de chat.
    - `channels.<channel>.execApprovals` — transforma esse canal em um cliente de aprovação nativo para aprovações de exec.

    A política de exec do host ainda é o verdadeiro mecanismo de aprovação; a configuração do chat controla apenas onde
    as solicitações aparecem e como as pessoas respondem.

    Raramente é necessário usar ambas:

    - Se o chat já aceita comandos e respostas, `/approve` no mesmo chat funciona pelo caminho compartilhado.
    - Quando um canal nativo compatível pode determinar os aprovadores com segurança, o OpenClaw ativa automaticamente aprovações nativas primeiro por DM se `channels.<channel>.execApprovals.enabled` não estiver definido ou for `"auto"`.
    - Quando cartões/botões nativos de aprovação estiverem disponíveis, essa interface será a principal; mencione um comando manual `/approve` somente se o resultado da ferramenta informar que as aprovações pelo chat estão indisponíveis.
    - Use `approvals.exec` somente quando as solicitações também precisarem chegar a outros chats ou salas de operações específicas.
    - Use `channels.<channel>.execApprovals.target: "channel"` ou `"both"` somente quando quiser que as solicitações de aprovação sejam publicadas novamente na sala/no tópico de origem.
    - As aprovações de Plugin são separadas: `/approve` no mesmo chat por padrão, encaminhamento opcional por `approvals.plugin`, e somente alguns canais nativos também mantêm o tratamento nativo delas.

    Em resumo: o encaminhamento serve para roteamento; a configuração do cliente nativo oferece uma experiência de uso mais avançada e específica do canal.
    Consulte [Aprovações de exec](/pt-BR/tools/exec-approvals).

  </Accordion>

  <Accordion title="De qual ambiente de execução preciso?">
    Node **22.19+** é obrigatório (Node 24 recomendado). `pnpm` é o gerenciador de pacotes do repositório.
    Bun **não é recomendado** para o Gateway.
  </Accordion>

  <Accordion title="Ele funciona no Raspberry Pi?">
    Sim, mas verifique primeiro a RAM: Pi 5 e Pi 4 (2 GB+) são as opções ideais; Pi 3B+ (1 GB) funciona, mas é lento; Pi Zero 2 W (512 MB) não é recomendado.

    | Modelo | RAM | Adequação |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Melhor |
    | Pi 4 | 4 GB | Boa |
    | Pi 4 | 2 GB | Adequada, adicione swap |
    | Pi 4 | 1 GB | Limitada |
    | Pi 3B+ | 1 GB | Lenta |
    | Pi Zero 2 W | 512 MB | Não recomendado |

    Mínimo absoluto: 1 GB de RAM, 1 núcleo, 500 MB de espaço livre em disco e sistema operacional de 64 bits. Como o Pi executa apenas
    o Gateway (os modelos chamam APIs na nuvem), até mesmo um Pi modesto suporta a carga.

    Um Pi/VPS pequeno também pode hospedar somente o Gateway enquanto você emparelha **Nodes** no seu
    notebook/celular para usar localmente tela/câmera/canvas ou executar comandos. Consulte [Nodes](/pt-BR/nodes).

    Guia completo de configuração: [Raspberry Pi](/pt-BR/install/raspberry-pi).

  </Accordion>

  <Accordion title="Alguma dica para instalações no Raspberry Pi?">
    - Use um sistema operacional de **64 bits**; não use o Raspberry Pi OS de 32 bits.
    - Adicione swap em placas com 2 GB ou menos.
    - Prefira um **SSD USB** em vez de um cartão SD para obter melhor desempenho e vida útil.
    - Prefira a instalação modificável (git) para poder consultar os logs e atualizar rapidamente.
    - Comece sem canais/Skills e adicione-os um por vez.
    - Falhas estranhas de binários ("exec format error") geralmente indicam a ausência de uma compilação ARM64 para a ferramenta de uma Skill opcional.

    Guia completo: [Raspberry Pi](/pt-BR/install/raspberry-pi). Consulte também [Linux](/pt-BR/platforms/linux).

  </Accordion>

  <Accordion title="Ele travou em “wake up my friend” / a integração inicial não conclui. O que faço agora?">
    Essa tela depende de o Gateway estar acessível e autenticado. A TUI também envia
    "Wake up, my friend!" automaticamente na primeira inicialização quando um provedor de modelos está configurado. Se
    você ignorou a configuração do modelo/autenticação, a integração inicial exibe uma observação "Model auth missing" e abre a
    TUI sem enviar nada — adicione um provedor com `openclaw configure --section model`.
    Se você vir a linha de ativação **sem resposta** e os tokens permanecerem em 0, o agente não foi executado.

    1. Reinicie o Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Verifique o status e a autenticação:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Ainda está travado? Execute:

    ```bash
    openclaw doctor
    ```

    Se o Gateway for remoto, confirme se a conexão do túnel/Tailscale está ativa e se a interface
    aponta para o Gateway correto. Consulte [Acesso remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrar minha configuração para uma máquina nova sem refazer a integração inicial?">
    Sim. Copie o **diretório de estado** e o **workspace** e execute o Doctor uma vez:

    1. Instale o OpenClaw na nova máquina.
    2. Copie `$OPENCLAW_STATE_DIR` (padrão: `~/.openclaw`) da máquina antiga.
    3. Copie seu workspace (padrão: `~/.openclaw/workspace`).
    4. Execute `openclaw doctor` e reinicie o serviço do Gateway.

    Isso preserva a configuração, os perfis de autenticação, as credenciais do WhatsApp, as sessões e a memória — mantendo
    seu bot exatamente igual, desde que você copie **ambos** os locais. No modo remoto, o
    host do Gateway controla o armazenamento de sessões e o workspace.

    **Importante:** se você apenas fizer commit/push do seu workspace para o GitHub, fará backup dos
    **arquivos de memória e inicialização**, mas não do histórico de sessões nem da autenticação. Eles ficam em
    `~/.openclaw/` (por exemplo, `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Relacionado: [Migração](/pt-BR/install/migrating), [Onde os itens ficam armazenados no disco](/pt-BR/help/faq#where-things-live-on-disk),
    [Workspace do agente](/pt-BR/concepts/agent-workspace), [Doctor](/pt-BR/gateway/doctor),
    [Modo remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde posso ver as novidades da versão mais recente?">
    Consulte o changelog no GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    As entradas mais recentes ficam no topo. Se a seção superior for **Não lançado**, a próxima seção
    com data será a versão publicada mais recente. As entradas são agrupadas em **Destaques**, **Alterações**
    e **Correções** (além de seções de documentação/outras, quando necessário).

  </Accordion>

  <Accordion title="Não é possível acessar docs.openclaw.ai (erro de SSL)">
    Algumas conexões da Comcast/Xfinity bloqueiam incorretamente `docs.openclaw.ai` por meio do Xfinity
    Advanced Security. Desative-o ou adicione `docs.openclaw.ai` à lista de permissões e tente novamente. Ajude-nos
    a remover o bloqueio: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Ainda está com problemas? A documentação está espelhada no GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Diferença entre estável e beta">
    **Estável** e **beta** são **dist-tags do npm**, não linhas de código separadas:

    - `latest` = estável
    - `beta` = compilação antecipada para testes (recorre a `latest` quando a versão beta está ausente ou é mais antiga que a versão estável atual)

    Uma versão estável geralmente chega primeiro ao canal **beta** e, depois, uma etapa explícita de promoção
    move essa mesma versão para `latest` sem alterar o número da versão. Os mantenedores
    também podem publicar diretamente em `latest`. É por isso que beta e estável podem apontar para a
    **mesma versão** após a promoção.

    Veja o que mudou: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Para comandos de instalação de uma linha e a diferença entre beta e dev, consulte o próximo acordeão.

  </Accordion>

  <Accordion title="Como instalo a versão beta e qual é a diferença entre beta e dev?">
    **Beta** é a dist-tag `beta` do npm (pode corresponder a `latest` após a promoção).
    **Dev** é a ponta móvel de `main` (git); quando publicada no npm, ela usa a dist-tag `dev`.

    Comandos de uma linha (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Instalador para Windows (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Mais detalhes: [Canais de desenvolvimento](/pt-BR/install/development-channels) e [Opções do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como posso experimentar as novidades mais recentes?">
    Duas opções:

    1. **Canal dev (instalação existente):**

    ```bash
    openclaw update --channel dev
    ```

    Isso muda para um checkout git de `main`, faz rebase sobre o upstream, compila e instala
    a CLI a partir desse checkout.

    2. **Instalação modificável (git) (máquina nova):**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Se preferir, faça um clone manual:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentação: [Atualização](/pt-BR/cli/update), [Canais de desenvolvimento](/pt-BR/install/development-channels), [Instalação](/pt-BR/install).

  </Accordion>

  <Accordion title="Quanto tempo a instalação e a integração inicial normalmente levam?">
    Estimativa aproximada:

    - **Instalação:** 2-5 minutos.
    - **Integração inicial pelo QuickStart:** alguns minutos (gateway de loopback, token automático, workspace padrão).
    - **Integração inicial avançada/completa:** demora mais quando o login no provedor, o pareamento de canais, a instalação do daemon, os downloads de rede ou as Skills exigem configuração adicional.

    O assistente mostra essa estimativa logo no início. Pule as etapas opcionais e retorne depois com
    `openclaw configure`.

    Travou? Consulte [Estou travado](#quick-start-and-first-run-setup) acima.

  </Accordion>

  <Accordion title="O instalador travou? Como obtenho mais informações?">
    Execute novamente com `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    O `install.ps1` não tem uma opção dedicada de saída detalhada; em vez disso, envolva-o com `Set-PSDebug -Trace 1` /
    `-Trace 0`. Referência completa das opções: [Opções do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="A instalação no Windows informa que o git não foi encontrado ou que openclaw não é reconhecido">
    Dois problemas comuns no Windows:

    **1) Erro do npm spawn git / git não encontrado**

    - Instale o **Git for Windows** e verifique se `git` está no PATH.
    - Feche e reabra o PowerShell e execute novamente o instalador.

    **2) openclaw não é reconhecido após a instalação**

    - A pasta global de binários do npm não está no PATH.
    - Verifique-a: `npm config get prefix`.
    - Adicione esse diretório ao PATH do usuário (não é necessário o sufixo `\bin`; na maioria dos sistemas, ele é `%AppData%\npm`).
    - Feche e reabra o PowerShell.

    Prefere um aplicativo para desktop? Use o **Windows Hub**. Para configuração somente pelo terminal, tanto o instalador
    do PowerShell quanto os caminhos do Gateway no WSL2 são compatíveis. Documentação: [Windows](/pt-BR/platforms/windows).

  </Accordion>

  <Accordion title="A saída de exec no Windows mostra texto em chinês corrompido — o que devo fazer?">
    Geralmente, isso ocorre devido a uma incompatibilidade da página de código do console em shells nativos do Windows.

    Sintomas: a saída de `system.run`/`exec` exibe texto em chinês com caracteres corrompidos; o mesmo comando
    aparece corretamente em outro perfil de terminal.

    Solução alternativa no PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Em seguida, reinicie o Gateway e tente novamente:

    ```powershell
    openclaw gateway restart
    ```

    O problema ainda ocorre na versão mais recente do OpenClaw? Acompanhe ou relate-o: [Issue #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="A documentação não respondeu à minha pergunta — como obtenho uma resposta melhor?">
    Use a instalação modificável (git) para ter todo o código-fonte e a documentação localmente e, em seguida, pergunte
    ao seu bot (ou ao Claude/Codex) **a partir dessa pasta**, para que ele possa ler o repositório e responder com precisão.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Mais detalhes: [Instalação](/pt-BR/install) e [Opções do instalador](/pt-BR/install/installer).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw no Linux?">
    - Caminho rápido para Linux + instalação do serviço: [Linux](/pt-BR/platforms/linux).
    - Guia completo: [Primeiros passos](/pt-BR/start/getting-started).
    - Instalador + atualizações: [Instalação e atualizações](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Como instalo o OpenClaw em uma VPS?">
    Qualquer VPS Linux funciona. Instale no servidor e acesse o Gateway via SSH/Tailscale.

    Guias: [exe.dev](/pt-BR/install/exe-dev), [Hetzner](/pt-BR/install/hetzner), [Fly.io](/pt-BR/install/fly).
    Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).

  </Accordion>

  <Accordion title="Onde estão os guias de instalação em nuvem/VPS?">
    Central de hospedagem com provedores comuns:

    - [Hospedagem em VPS](/pt-BR/vps) (todos os provedores em um só lugar)
    - [Fly.io](/pt-BR/install/fly)
    - [Hetzner](/pt-BR/install/hetzner)
    - [exe.dev](/pt-BR/install/exe-dev)

    Na nuvem, o **Gateway é executado no servidor**, e você o acessa pelo notebook/celular
    por meio da interface de controle (ou Tailscale/SSH). Seu estado + workspace ficam no servidor, portanto
    trate o host como a fonte da verdade e faça backup dele.

    Pareie **Nodes** (Mac/iOS/Android/sem interface gráfica) com esse Gateway na nuvem para usar
    tela/câmera/canvas locais ou executar comandos no notebook enquanto o Gateway permanece na
    nuvem.

    Central: [Plataformas](/pt-BR/platforms). Acesso remoto: [Gateway remoto](/pt-BR/gateway/remote).
    Nodes: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso pedir ao OpenClaw que se atualize sozinho?">
    É possível, mas não é recomendado. O fluxo de atualização pode reiniciar o Gateway (encerrando a
    sessão ativa), pode exigir um checkout git limpo e pode solicitar confirmação.
    É mais seguro executar as atualizações em um shell como operador.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automação a partir de um agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentação: [Atualização](/pt-BR/cli/update), [Como atualizar](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="O que a integração inicial realmente faz?">
    `openclaw onboard` é o caminho de configuração recomendado. No **modo local**, ele orienta você por:

    1. **Modelo/autenticação** - OAuth do provedor, chaves de API ou autenticação manual (incluindo opções locais, como o LM Studio); escolha um modelo padrão.
    2. **Workspace** - localização + arquivos de inicialização.
    3. **Gateway** - porta, endereço de vinculação, modo de autenticação, exposição pelo Tailscale.
    4. **Canais** - canais de chat integrados e de Plugins oficiais: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e outros.
    5. **Daemon** - LaunchAgent (macOS), unidade de usuário do systemd (Linux/WSL2) ou Tarefa Agendada nativa do Windows.
    6. **Verificação de integridade** - inicia o Gateway e verifica se ele está em execução.
    7. **Skills** - instala as Skills recomendadas e as dependências opcionais.

    Ele informa antecipadamente a duração esperada e avisa se o modelo configurado é desconhecido
    ou não tem autenticação. Detalhamento completo: [Integração inicial (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Preciso de uma assinatura do Claude ou da OpenAI para executar isto?">
    Não. Execute o OpenClaw com **chaves de API** (Anthropic/OpenAI/outros) ou **modelos exclusivamente locais**
    para que seus dados permaneçam no dispositivo. Assinaturas (Claude Pro/Max, ChatGPT/Codex) são
    formas opcionais de autenticar nesses provedores.

    Para a Anthropic: uma **chave de API** oferece cobrança padrão por uso; a **CLI do Claude**
    reutiliza um login existente do Claude Code no mesmo host. Atualmente, a Anthropic considera
    o caminho não interativo `claude -p` da CLI do Claude como uso programático/do Agent SDK, que
    ainda consome os limites do plano da sua assinatura — consulte a documentação atual de cobrança
    da Anthropic antes de depender do comportamento da assinatura. Para hosts de Gateway de longa duração e automação
    compartilhada, uma chave de API da Anthropic é a opção mais previsível.

    O OAuth do OpenAI Codex (assinatura ChatGPT/Codex) é totalmente compatível com modelos de agentes.
    O OpenClaw também oferece opções hospedadas no estilo de assinatura, incluindo **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** e **Z.AI / GLM Coding Plan**.

    Documentação: [Anthropic](/pt-BR/providers/anthropic), [OpenAI](/pt-BR/providers/openai),
    [Qwen Cloud](/pt-BR/providers/qwen), [MiniMax](/pt-BR/providers/minimax), [Z.AI (GLM)](/pt-BR/providers/zai),
    [Modelos locais](/pt-BR/gateway/local-models), [Modelos](/pt-BR/concepts/models).

  </Accordion>

  <Accordion title="Posso usar uma assinatura Claude Max sem uma chave de API?">
    Sim. O OpenClaw é compatível com a reutilização da CLI do Claude nos planos Pro/Max/Team/Enterprise. Atualmente, a Anthropic
    considera o caminho `claude -p` usado pelo OpenClaw como uso do plano de assinatura, sujeito
    aos limites do seu plano, e não como uma franquia gratuita separada — consulte
    [Anthropic](/pt-BR/providers/anthropic) para obter os detalhes atuais de cobrança e links para
    os artigos de suporte da própria Anthropic. Para uma configuração do lado do servidor mais previsível, use uma
    chave de API da Anthropic.
  </Accordion>

  <Accordion title="Há compatibilidade com autenticação por assinatura do Claude (Claude Pro ou Max)?">
    Sim, por meio da reutilização da CLI do Claude. O tratamento de cobrança da Anthropic para o uso de `claude -p`/Agent SDK
    mudou ao longo do tempo; consulte [Anthropic](/pt-BR/providers/anthropic) para verificar a situação atual e
    os links datados para os artigos de suporte da Anthropic antes de depender de um comportamento específico de
    cobrança.

    A autenticação por token de configuração da Anthropic também continua sendo uma opção de token compatível, mas o OpenClaw prefere
    a reutilização da CLI do Claude e `claude -p` quando disponíveis. Para cargas de trabalho de produção ou com vários usuários,
    uma chave de API da Anthropic continua sendo a opção mais segura e previsível. Outras
    opções hospedadas no estilo de assinatura: [OpenAI](/pt-BR/providers/openai), [Qwen Cloud](/pt-BR/providers/qwen),
    [MiniMax](/pt-BR/providers/minimax), [Z.AI (GLM)](/pt-BR/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Por que estou vendo HTTP 429 rate_limit_error da Anthropic?">
    Sua **cota/limite de taxa da Anthropic** se esgotou para a janela atual. Na **Claude
    CLI**, aguarde a redefinição da janela ou faça upgrade do seu plano. Com uma **chave de API da Anthropic**,
    verifique o uso/faturamento no Anthropic Console e aumente os limites conforme necessário.

    Se a mensagem for especificamente `Extra usage is required for long context requests`,
    a solicitação está tentando usar a janela de contexto de 1M da Anthropic (um modelo Claude 4.x
    de 1M com disponibilidade geral ou a configuração legada `params.context1m: true`), e sua credencial atual não
    está qualificada para faturamento de contexto longo.

    Defina um **modelo de fallback** para que o OpenClaw continue respondendo enquanto um provedor estiver com limite de taxa.
    Consulte [Modelos](/pt-BR/cli/models), [OAuth](/pt-BR/concepts/oauth) e
    [Uso adicional exigido no erro 429 da Anthropic para contexto longo](/pt-BR/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Há suporte ao AWS Bedrock?">
    Sim. O OpenClaw tem um provedor **Amazon Bedrock (Converse)** incluído. Quando os marcadores
    de ambiente da AWS estão presentes (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    o OpenClaw habilita automaticamente o provedor Bedrock implícito para descoberta de modelos; caso contrário,
    defina `plugins.entries.amazon-bedrock.config.discovery.enabled: true` ou adicione uma entrada
    manual de provedor. Consulte [Amazon Bedrock](/pt-BR/providers/bedrock) e [Provedores de modelos](/pt-BR/providers/models).
    Um proxy compatível com OpenAI na frente do Bedrock continua sendo uma opção válida se você preferir um fluxo de chave gerenciada.
  </Accordion>

  <Accordion title="Como funciona a autenticação do Codex?">
    O OpenClaw oferece suporte ao **OpenAI Codex** via OAuth (login no ChatGPT). Uma nova
    configuração sem modelo principal usa exatamente `openai/gpt-5.6-sol` para
    autenticação de assinatura do ChatGPT/Codex, além da execução nativa pelo app-server do Codex.
    A reautenticação preserva um modelo explícito existente, incluindo
    `openai/gpt-5.5`. Se o workspace do Codex não disponibilizar o GPT-5.6, selecione
    `openai/gpt-5.5` explicitamente; o OpenClaw não faz downgrade silenciosamente. Referências
    de modelo legadas com prefixo Codex são configurações legadas reparadas por `openclaw doctor
    --fix`. O acesso direto por chave de API da OpenAI continua disponível para superfícies
    não relacionadas a agentes da API da OpenAI e, por meio de um perfil ordenado de chave de API
    `openai`, também para modelos de agente. Consulte [Provedores de modelos](/pt-BR/concepts/model-providers) e
    [Integração inicial (CLI)](/pt-BR/start/wizard).
  </Accordion>

  <Accordion title="Por que o OpenClaw ainda menciona o prefixo legado OpenAI Codex?">
    `openai` é o provedor e o id de perfil de autenticação atual tanto para chaves de API da OpenAI quanto para
    OAuth do ChatGPT/Codex — o OpenAI Codex foi incorporado a ele. Você ainda pode ver um prefixo legado
    `openai-codex` em configurações antigas e avisos de migração:

    - `openai/gpt-5.6-sol` = nova configuração de assinatura do ChatGPT/Codex com o runtime nativo do Codex para interações do agente.
    - `openai/gpt-5.5` = seleção explícita compatível para configurações existentes ou contas sem acesso ao GPT-5.6.
    - Referências de modelo legadas `openai-codex/*` = rota legada reparada por `openclaw doctor --fix`.
    - `openai/gpt-5.5` mais um perfil ordenado de chave de API `openai` = autenticação por chave de API para um modelo de agente da OpenAI.
    - IDs de perfil de autenticação legados `openai-codex` = IDs legados migrados por `openclaw doctor --fix`.

    Quer faturamento direto pela OpenAI Platform? Defina `OPENAI_API_KEY`. Quer autenticação
    por assinatura do ChatGPT/Codex? Execute `openclaw models auth login --provider openai`. Mantenha
    as referências de modelo no provedor canônico `openai/*`. Uma nova configuração de assinatura
    usa exatamente `openai/gpt-5.6-sol`; o doctor repara referências legadas com prefixo Codex
    sem atualizar uma seleção explícita de `openai/gpt-5.5`.

  </Accordion>

  <Accordion title="Por que os limites do OAuth do Codex podem ser diferentes dos do ChatGPT na web?">
    O OAuth do Codex usa janelas de cota gerenciadas pela OpenAI e dependentes do plano, que podem ser diferentes da
    experiência no site/aplicativo do ChatGPT, mesmo na mesma conta.

    `openclaw models status` mostra as janelas de uso/cota do provedor visíveis no momento, mas
    não cria nem normaliza os direitos de uso do ChatGPT na web como acesso direto à API. Para o
    caminho de faturamento/limites direto da OpenAI Platform, use `openai/*` com uma chave de API.

  </Accordion>

  <Accordion title="Há suporte à autenticação por assinatura da OpenAI (OAuth do Codex)?">
    Sim, integralmente. A OpenAI permite explicitamente o uso de OAuth de assinatura em
    ferramentas/fluxos de trabalho externos, como o OpenClaw. A integração inicial pode executar o fluxo OAuth para você.

    Consulte [OAuth](/pt-BR/concepts/oauth), [Provedores de modelos](/pt-BR/concepts/model-providers) e [Integração inicial (CLI)](/pt-BR/start/wizard).

  </Accordion>

  <Accordion title="Como configuro o OAuth da Gemini CLI?">
    A Gemini CLI usa um **fluxo de autenticação de Plugin**, não um id de cliente ou segredo em `openclaw.json`.

    1. Instale a Gemini CLI localmente para que `gemini` esteja no `PATH`:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Habilite o Plugin: `openclaw plugins enable google`
    3. Faça login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modelo padrão após o login: `google/gemini-3.1-pro-preview` (runtime `google-gemini-cli`)
    5. As solicitações falham após o login? Defina `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` no host do Gateway e tente novamente.

    Os tokens OAuth são armazenados em perfis de autenticação no host do Gateway. Detalhes: [Google](/pt-BR/providers/google), [Provedores de modelos](/pt-BR/concepts/model-providers).

  </Accordion>

  <Accordion title="Um modelo local serve para conversas casuais?">
    Geralmente, não. O OpenClaw precisa de contexto amplo e segurança robusta; placas pequenas truncam o contexto
    e ignoram os filtros de segurança do provedor. Se for necessário, execute localmente a compilação de modelo
    **maior** que puder (LM Studio) — consulte [Modelos locais](/pt-BR/gateway/local-models). Modelos menores/quantizados
    aumentam o risco de injeção de prompt — consulte [Segurança](/pt-BR/gateway/security).
  </Accordion>

  <Accordion title="Como mantenho o tráfego de modelos hospedados em uma região específica?">
    Escolha endpoints vinculados a uma região. O OpenRouter oferece opções hospedadas nos EUA para MiniMax, Kimi
    e GLM; escolha a variante hospedada nos EUA para manter os dados na região. Você ainda pode listar
    Anthropic/OpenAI junto com essas opções usando `models.mode: "merge"`, para que os fallbacks continuem
    disponíveis sem deixar de respeitar o provedor regional selecionado.
  </Accordion>

  <Accordion title="Preciso comprar um Mac Mini para instalar isto?">
    Não. O OpenClaw é executado no macOS ou Linux (Windows via WSL2). Um Mac mini é uma opção popular
    de host sempre ativo, mas um VPS pequeno, servidor doméstico ou equipamento da categoria do Raspberry Pi também funciona.

    Você só precisa de um Mac **para ferramentas exclusivas do macOS**. Para o iMessage, use [iMessage](/pt-BR/channels/imessage)
    com `imsg` em qualquer Mac conectado ao Messages — se o Gateway for executado no Linux ou em outro lugar,
    defina `channels.imessage.cliPath` como um wrapper SSH que execute `imsg` nesse Mac. Para outras
    ferramentas exclusivas do macOS, execute o Gateway em um Mac ou emparelhe um Node macOS.

    Documentação: [iMessage](/pt-BR/channels/imessage), [Nodes](/pt-BR/nodes), [Modo remoto do Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Preciso de um Mac mini para ter suporte ao iMessage?">
    Você precisa de **algum dispositivo macOS** conectado ao Messages — não necessariamente um Mac mini; qualquer
    Mac funciona. Use [iMessage](/pt-BR/channels/imessage) com `imsg`; o Gateway pode ser executado nesse
    Mac ou em outro local com um wrapper SSH em `cliPath`.

    Configurações comuns:

    - Gateway no Linux/VPS, com `channels.imessage.cliPath` definido como um wrapper SSH que executa `imsg` em um Mac conectado ao Messages.
    - Tudo em um único Mac para a configuração mais simples em uma única máquina.

    Documentação: [iMessage](/pt-BR/channels/imessage), [Nodes](/pt-BR/nodes), [Modo remoto do Mac](/pt-BR/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se eu comprar um Mac mini para executar o OpenClaw, posso conectá-lo ao meu MacBook Pro?">
    Sim. O **Mac mini pode executar o Gateway**, e seu MacBook Pro se conecta como um **Node**
    (dispositivo complementar). Os Nodes não executam o Gateway — eles adicionam recursos como
    tela/câmera/canvas e `system.run` nesse dispositivo.

    Padrão comum: Gateway no Mac mini sempre ativo; o MacBook Pro executa o aplicativo macOS ou um
    host de Node e é emparelhado com o Gateway. Verifique com `openclaw nodes status` / `openclaw nodes list`.

    Documentação: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes).

  </Accordion>

  <Accordion title="Posso usar Bun?">
    Não é recomendado — o Bun tem bugs de runtime, especialmente com WhatsApp e Telegram. Use
    **Node** para gateways estáveis. Se ainda quiser experimentar, faça isso em um
    gateway que não seja de produção e sem WhatsApp/Telegram.
  </Accordion>

  <Accordion title="Telegram: o que deve ser inserido em allowFrom?">
    `channels.telegram.allowFrom` é o **ID de usuário do Telegram do remetente humano** (numérico),
    não o nome de usuário do bot. A configuração solicita apenas IDs numéricos de usuário; `openclaw doctor --fix`
    pode tentar resolver entradas legadas `@username`.

    Mais seguro (sem bot de terceiros): envie uma mensagem direta ao seu bot, execute `openclaw logs --follow` e leia `from.id`.

    API oficial de bots: envie uma mensagem direta ao seu bot, acesse `https://api.telegram.org/bot<bot_token>/getUpdates` e leia `message.from.id`.

    Terceiros (menos privado): envie uma mensagem direta para `@userinfobot` ou `@getidsbot`.

    Consulte [Controle de acesso do Telegram](/pt-BR/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Várias pessoas podem usar um número do WhatsApp com instâncias diferentes do OpenClaw?">
    Sim, por meio do **roteamento multiagente**. Vincule a mensagem direta de cada remetente no WhatsApp (`peer: { kind: "direct", id: "+15551234567" }`) a um `agentId` diferente, fornecendo a cada pessoa seu próprio workspace e armazenamento de sessões. As respostas continuam sendo enviadas pela **mesma conta do WhatsApp**; o controle de acesso a mensagens diretas (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) é global por conta. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent) e [WhatsApp](/pt-BR/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso executar um agente de "conversa rápida" e outro de "Opus para programação"?'>
    Sim. Use o roteamento multiagente: forneça a cada agente seu próprio modelo padrão e vincule as rotas
    de entrada (conta do provedor ou pares específicos) a cada agente. Exemplo de configuração:
    [Roteamento multiagente](/pt-BR/concepts/multi-agent). Consulte também [Modelos](/pt-BR/concepts/models) e
    [Configuração](/pt-BR/gateway/configuration).
  </Accordion>

  <Accordion title="O Homebrew funciona no Linux?">
    Sim, por meio do Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Ao executar o OpenClaw via systemd, certifique-se de que o PATH do serviço inclua
    `/home/linuxbrew/.linuxbrew/bin` (ou o prefixo do seu brew), para que as ferramentas instaladas pelo `brew`
    sejam encontradas em shells sem login. Compilações recentes também adicionam no início do PATH diretórios comuns de binários do usuário em serviços
    systemd do Linux (por exemplo, `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) e respeitam `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando definidos.

  </Accordion>

  <Accordion title="Diferença entre a instalação hackeável via git e a instalação via npm">
    - **Instalação hackeável (git):** checkout completo do código-fonte, editável e ideal para colaboradores. Você compila localmente e pode modificar o código/documentação.
    - **Instalação via npm:** instalação global da CLI, sem repositório, ideal para "simplesmente executar". As atualizações vêm das dist-tags do npm.

    Documentação: [Primeiros passos](/pt-BR/start/getting-started), [Atualização](/pt-BR/install/updating).

  </Accordion>

  <Accordion title="Posso alternar posteriormente entre instalações via npm e git?">
    Sim, com `openclaw update --channel ...` em uma instalação existente. Isso **não
    exclui seus dados** — somente a instalação do código do OpenClaw é alterada. O estado (`~/.openclaw`) e o
    workspace (`~/.openclaw/workspace`) permanecem intactos.

    De npm para git:

    ```bash
    openclaw update --channel dev
    ```

    De git para npm:

    ```bash
    openclaw update --channel stable
    ```

    Adicione `--dry-run` para visualizar primeiro a mudança de modo planejada. O atualizador executa os acompanhamentos do Doctor,
    atualiza as fontes dos plugins para o canal de destino e reinicia o Gateway,
    a menos que você use `--no-restart`.

    O instalador também pode forçar qualquer um dos modos:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Dicas de backup: [Onde os itens ficam armazenados no disco](/pt-BR/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Devo executar o Gateway no meu laptop ou em um VPS?">
    Quer confiabilidade 24 horas por dia, 7 dias por semana? Use um **VPS**. Quer o mínimo de complicação e não se importa com
    suspensões/reinicializações? Execute-o localmente.

    **Laptop (Gateway local)**

    - **Vantagens:** sem custo de servidor, acesso direto aos arquivos locais, uma janela ativa do navegador.
    - **Desvantagens:** suspensões/quedas de rede o desconectam, atualizações/reinicializações do sistema operacional o interrompem, precisa permanecer ativo.

    **VPS / nuvem**

    - **Vantagens:** sempre ativo, rede estável, sem problemas de suspensão do laptop, mais fácil de manter em execução.
    - **Desvantagens:** geralmente sem interface gráfica (use capturas de tela), somente acesso remoto aos arquivos, SSH necessário para atualizações.

    WhatsApp/Telegram/Slack/Mattermost/Discord funcionam bem em um VPS — a verdadeira
    escolha é entre um navegador sem interface gráfica e uma janela visível. Consulte [Navegador](/pt-BR/tools/browser).

    Recomendação padrão: VPS se você já teve desconexões do Gateway; a execução local é ótima
    quando você está usando o Mac ativamente e quer acesso aos arquivos locais ou automação da interface
    com navegador visível.

  </Accordion>

  <Accordion title="Qual é a importância de executar o OpenClaw em uma máquina dedicada?">
    Não é obrigatório, mas é recomendado para confiabilidade e isolamento.

    - **Host dedicado (VPS/Mac mini/Raspberry Pi):** sempre ativo, menos interrupções por suspensão/reinicialização, permissões mais organizadas, mais fácil de manter em execução.
    - **Laptop/desktop compartilhado:** adequado para testes e uso ativo, mas espere pausas quando a máquina entrar em suspensão ou for atualizada.

    Para aproveitar o melhor dos dois mundos, mantenha o Gateway em um host dedicado e emparelhe seu laptop como um
    **Node** para ferramentas locais de tela/câmera/execução. Consulte [Nodes](/pt-BR/nodes) e [Segurança](/pt-BR/gateway/security).

  </Accordion>

  <Accordion title="Quais são os requisitos mínimos de VPS e o sistema operacional recomendado?">
    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM, ~500 MB de disco.
    - **Recomendado:** 1-2 vCPU, 2 GB ou mais de RAM para ter margem (logs, mídia, vários canais). Ferramentas de Node e automação do navegador podem consumir muitos recursos.

    Sistema operacional: **Ubuntu LTS** (ou qualquer Debian/Ubuntu moderno) — o caminho de instalação no Linux mais testado.

    Documentação: [Linux](/pt-BR/platforms/linux), [Hospedagem em VPS](/pt-BR/vps).

  </Accordion>

  <Accordion title="Posso executar o OpenClaw em uma VM e quais são os requisitos?">
    Sim. Trate uma VM como um VPS: ela precisa estar sempre ativa, acessível e ter RAM suficiente
    para o Gateway e os canais que você habilitar.

    - **Mínimo absoluto:** 1 vCPU, 1 GB de RAM.
    - **Recomendado:** 2 GB ou mais de RAM para vários canais, automação do navegador ou ferramentas de mídia.
    - **Sistema operacional:** Ubuntu LTS ou outro Debian/Ubuntu moderno.

    No Windows, use o **Windows Hub** para a configuração do desktop ou o WSL2 para uma VM de Gateway no estilo Linux
    com ampla compatibilidade de ferramentas. Consulte [Windows](/pt-BR/platforms/windows), [Hospedagem em VPS](/pt-BR/vps).
    Para executar o macOS em uma VM, consulte [VM do macOS](/pt-BR/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Perguntas frequentes](/pt-BR/help/faq) — as principais perguntas frequentes (modelos, sessões, Gateway, segurança e muito mais)
- [Visão geral da instalação](/pt-BR/install)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Solução de problemas](/pt-BR/help/troubleshooting)
