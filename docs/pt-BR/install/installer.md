---
read_when:
    - Você quer entender `openclaw.ai/install.sh`
    - Você quer automatizar instalações (CI / sem interface gráfica)
    - Você quer instalar a partir de um checkout do GitHub
summary: Como funcionam os scripts de instalação (install.sh, install-cli.sh, install.ps1), as flags e a automação
title: Aspectos internos do instalador
x-i18n:
    generated_at: "2026-07-16T12:35:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

O OpenClaw inclui três scripts de instalação, disponibilizados em `openclaw.ai`.

| Script                             | Plataforma             | O que faz                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala o Node, se necessário, instala o OpenClaw via npm (padrão) ou git e pode executar a configuração inicial.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala o Node + OpenClaw em um prefixo local (`~/.openclaw`) via npm ou git. Não requer acesso root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala o Node, se necessário, instala o OpenClaw via npm (padrão) ou git e pode executar a configuração inicial.       |

Todos os três são compatíveis com o Node **22.22.3+, 24.15+ ou 25.9+**; o Node 24 é o destino padrão para novas instalações.

## Comandos rápidos

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Se a instalação for bem-sucedida, mas `openclaw` não for encontrado em um novo terminal, consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para a maioria das instalações interativas no macOS/Linux/WSL.
</Tip>

### Fluxo (install.sh)

<Steps>
  <Step title="Detectar o sistema operacional">
    Compatível com macOS e Linux (incluindo WSL).
  </Step>
  <Step title="Garantir o Node.js 24 por padrão">
    Verifica a versão do Node e instala o Node 24, se necessário (Homebrew no macOS, scripts de configuração do NodeSource no Linux com apt/dnf/yum). No macOS, o Homebrew é instalado somente quando o instalador precisa dele para o Node ou o Git. Node 22.22.3+, Node 24.15+ e Node 25.9+ são compatíveis; o Node 23 não é compatível.
    No Alpine/Linux com musl, o instalador usa pacotes apk em vez do NodeSource e verifica a versão real vinculada do SQLite. Os fluxos de pacotes estáveis atuais do Alpine podem fornecer um Node suficientemente recente com um SQLite vulnerável do sistema; quando isso ocorrer, use um contêiner oficial `node:24-alpine` ou um host baseado em glibc.
  </Step>
  <Step title="Garantir o Git">
    Instala o Git, caso não esteja presente, usando o gerenciador de pacotes detectado, incluindo o Homebrew no macOS e o apk no Alpine.
  </Step>
  <Step title="Instalar o OpenClaw">
    - Método `npm` (padrão): instalação global via npm
    - Método `git`: clona/atualiza o repositório, instala as dependências com pnpm, compila e, em seguida, instala o wrapper em `~/.local/bin/openclaw`

  </Step>
  <Step title="Tarefas pós-instalação">
    - Resolve o binário `openclaw` recém-instalado para comandos subsequentes
    - Para uma instalação não configurada, inicia a configuração inicial antes das verificações do doctor ou do gateway. Com `--no-onboard` ou sem TTY, exibe o comando para concluir a configuração posteriormente.
    - Para uma instalação configurada, atualiza e reinicia, na medida do possível, um serviço do gateway carregado e executa o doctor. As atualizações atualizam os plugins quando possível ou exibem o comando manual em uma execução sem interface gráfica com prompts habilitados.
    - Quando `--verify` é executado, verifica a versão instalada e a integridade do gateway somente após a configuração existir.

  </Step>
</Steps>

### Detecção do checkout do código-fonte

Se executado dentro de um checkout do OpenClaw (`package.json` + `pnpm-workspace.yaml`), o script oferece as opções:

- usar o checkout (`git`) ou
- usar a instalação global (`npm`)

Se nenhum TTY estiver disponível e nenhum método de instalação estiver definido, o padrão será `npm` e um aviso será exibido.

O script é encerrado com o código `2` quando a seleção do método ou os valores de `--install-method` são inválidos.

### Exemplos (install.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Ignorar a configuração inicial">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalação via Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout da branch main do GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Simulação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verificar após a instalação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                                    | Descrição                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Escolhe o método de instalação (padrão: `npm`)                                  |
| `--npm`                                 | Atalho para o método npm                                                 |
| `--git \| --github`                     | Atalho para o método git                                                 |
| `--version <version\|dist-tag\|spec>`   | Versão, dist-tag ou especificação de pacote npm (padrão: `latest`)              |
| `--beta`                                | Usa a dist-tag beta, se disponível; caso contrário, usa `latest`              |
| `--git-dir \| --dir <path>`             | Diretório do checkout (padrão: `~/openclaw`)                              |
| `--no-git-update`                       | Ignora `git pull` para um checkout existente                                   |
| `--no-prompt`                           | Desativa os prompts                                                         |
| `--no-onboard`                          | Ignora a configuração inicial                                                         |
| `--onboard`                             | Ativa a configuração inicial                                                       |
| `--verify`                              | Executa uma verificação rápida pós-instalação (`--version`, integridade do gateway se carregado) |
| `--dry-run`                             | Exibe as ações sem aplicar alterações                                  |
| `--verbose`                             | Ativa a saída de depuração (`set -x`, logs do npm no nível notice)                   |
| `--help \| -h`                          | Exibe as instruções de uso                                                              |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                          | Descrição                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Método de instalação                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versão, dist-tag ou especificação de pacote npm                             |
| `OPENCLAW_BETA=0\|1`                              | Usa a versão beta, se disponível                                              |
| `OPENCLAW_HOME=<path>`                            | Diretório-base para o estado do OpenClaw e os caminhos padrão do git/configuração inicial |
| `OPENCLAW_GIT_DIR=<path>`                         | Diretório do checkout                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Ativa ou desativa as atualizações via git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Desativa os prompts                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Executa a verificação rápida pós-instalação                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Ignora a configuração inicial                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Modo de simulação                                                       |
| `OPENCLAW_VERBOSE=1`                              | Modo de depuração                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Nível de log do npm (padrão: `error`, oculta mensagens de descontinuação do npm)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Projetado para ambientes nos quais se deseja manter tudo em um prefixo local
(padrão `~/.openclaw`) e sem dependência do Node do sistema. Por padrão, é compatível com instalações via npm,
além de instalações a partir de um checkout do git no mesmo fluxo de prefixo.
</Info>

### Fluxo (install-cli.sh)

<Steps>
  <Step title="Instalar o runtime local do Node">
    Baixa um tarball fixado de uma versão LTS compatível do Node (a versão está incorporada ao script e é atualizada de forma independente; o padrão é `24.15.0`) em `<prefix>/tools/node-v<version>` e verifica o SHA-256.
    O Linux ARMv7 usa o Node `22.22.3` porque os binários oficiais do Node 24+ para ARMv7 não estão disponíveis.
    No Alpine/Linux com musl, onde o Node não publica tarballs compatíveis para o runtime fixado, instala `nodejs` e `npm` com `apk` e, em seguida, verifica tanto o Node quanto a biblioteca SQLite realmente vinculada. Os fluxos de pacotes estáveis atuais do Alpine ainda podem vincular um SQLite vulnerável, mesmo com um Node suficientemente recente; use um contêiner oficial `node:24-alpine` ou um host baseado em glibc quando a verificação de segurança rejeitar o pacote.
  </Step>
  <Step title="Garantir o Git">
    Se o Git não estiver presente, tenta instalá-lo via apt/dnf/yum/apk no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Instalar o OpenClaw no prefixo">
    - Método `npm` (padrão): instala no prefixo com npm e grava o wrapper em `<prefix>/bin/openclaw`
    - Método `git`: clona/atualiza um checkout (padrão `~/openclaw`) e também grava o wrapper em `<prefix>/bin/openclaw`

  </Step>
  <Step title="Atualizar o serviço do gateway carregado">
    Se um serviço do gateway já estiver carregado a partir desse mesmo prefixo, o script executará
    `openclaw gateway install --force`, que ativa o serviço substituto,
    e depois verificará a integridade do gateway na medida do possível.
  </Step>
</Steps>

### Exemplos (install-cli.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Prefixo personalizado + versão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Instalação via Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Saída JSON para automação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Executar a configuração inicial">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Sinalizador                             | Descrição                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| `--prefix <path>`                     | Prefixo de instalação (padrão: `~/.openclaw`)                                |
| `--install-method \| --method npm\|git`                     | Escolher o método de instalação (padrão: `npm`)                      |
| `--npm`                     | Atalho para o método npm                                                          |
| `--git \| --github`                     | Atalho para o método git                                                          |
| `--git-dir \| --dir <path>`                     | Diretório de checkout do Git (padrão: `~/openclaw`)                         |
| `--version <ver>`                     | Versão ou dist-tag do OpenClaw (padrão: `latest`)                       |
| `--node-version <ver>`                     | Versão do Node (padrão: `24.15.0`; `22.22.3` no Linux ARMv7)    |
| `--json`                     | Emitir eventos NDJSON                                                             |
| `--onboard`                     | Executar `openclaw onboard` após a instalação                                    |
| `--no-onboard`                     | Ignorar a integração inicial (padrão)                                              |
| `--set-npm-prefix`                     | No Linux, forçar o prefixo npm para `~/.npm-global` se o prefixo atual não permitir gravação |
| `--help \| -h`                     | Exibir instruções de uso                                                          |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                    | Descrição                                                            |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                         | Prefixo de instalação                                                 |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                         | Método de instalação                                                  |
| `OPENCLAW_VERSION=<ver>`                         | Versão ou dist-tag do OpenClaw                                        |
| `OPENCLAW_NODE_VERSION=<ver>`                         | Versão do Node                                                        |
| `OPENCLAW_HOME=<path>`                         | Diretório base para o estado do OpenClaw e caminhos padrão de git/integração inicial |
| `OPENCLAW_GIT_DIR=<path>`                         | Diretório de checkout do Git para instalações via git                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                         | Ativar ou desativar atualizações via git para checkouts existentes    |
| `OPENCLAW_NO_ONBOARD=1`                         | Ignorar a integração inicial                                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`                         | Nível de log do npm (padrão: `error`)                      |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` e outras especificações de origem do GitHub não são destinos `--version` válidos para instalações via npm. Use `--install-method git --version main` em vez disso.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Fluxo (install.ps1)

<Steps>
  <Step title="Garantir o ambiente PowerShell + Windows">
    Requer PowerShell 5+.
  </Step>
  <Step title="Garantir o Node.js 24 por padrão">
    Se estiver ausente, tenta instalá-lo pelo winget, depois pelo Chocolatey e, em seguida, pelo Scoop. Se nenhum gerenciador de pacotes estiver disponível, o script baixa o arquivo zip oficial do Node.js 24 para Windows em `%LOCALAPPDATA%\OpenClaw\deps\portable-node` e o adiciona ao PATH do processo atual e do usuário. Há suporte para Node 22.22.3+, Node 24.15+ e Node 25.9+; não há suporte para Node 23.
  </Step>
  <Step title="Instalar o OpenClaw">
    - Método `npm` (padrão): instalação global via npm usando o `-Tag` selecionado, iniciada a partir de um diretório temporário do instalador com permissão de gravação, para que shells abertos em pastas protegidas, como `C:\`, continuem funcionando
    - Método `git`: clona/atualiza o repositório, instala/compila com pnpm e instala o wrapper em `%USERPROFILE%\.local\bin\openclaw.cmd`. Se o Git estiver ausente, o script inicializa o MinGit local do usuário em `%LOCALAPPDATA%\OpenClaw\deps\portable-git` e o adiciona ao PATH do processo atual e do usuário.

  </Step>
  <Step title="Tarefas pós-instalação">
    - Adiciona o diretório de binários necessário ao PATH do usuário quando possível
    - Atualiza, em caráter de melhor esforço, um serviço Gateway carregado (`openclaw gateway install --force` e depois reinicialização)
    - Executa `openclaw doctor --non-interactive` em atualizações e instalações via git (melhor esforço)

  </Step>
  <Step title="Tratar falhas">
    Instalações com `iwr ... | iex` e blocos de script relatam um erro de encerramento sem fechar a sessão atual do PowerShell. Instalações diretas com `powershell -File` / `pwsh -File` ainda encerram com código diferente de zero para automação.
  </Step>
</Steps>

### Exemplos (install.ps1)

<Tabs>
  <Tab title="Padrão">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Instalação via Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Checkout da main no GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Diretório git personalizado">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Simulação">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de sinalizadores">

| Sinalizador                 | Descrição                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| `-InstallMethod npm\|git`          | Método de instalação (padrão: `npm`)                |
| `-Tag <tag\|version\|spec>`          | dist-tag, versão ou especificação de pacote npm (padrão: `latest`) |
| `-GitDir <path>`          | Diretório de checkout (padrão: `%USERPROFILE%\openclaw`)               |
| `-NoOnboard`          | Ignorar a integração inicial                                     |
| `-NoGitUpdate`          | Ignorar `git pull`                                       |
| `-DryRun`          | Imprimir somente as ações                                        |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                           | Descrição                     |
| ---------------------------------- | ----------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Método de instalação          |
| `OPENCLAW_GIT_DIR=<path>`                | Diretório de checkout         |
| `OPENCLAW_NO_ONBOARD=1`                | Ignorar a integração inicial  |
| `OPENCLAW_GIT_UPDATE=0`                | Desativar o git pull          |
| `OPENCLAW_DRY_RUN=1`                | Modo de simulação             |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git estiver ausente, o script tentará inicializar um MinGit local do usuário antes de exibir o link do Git for Windows.
</Note>

---

## CI e automação

Use sinalizadores/variáveis de ambiente não interativos para obter execuções previsíveis.

<Tabs>
  <Tab title="install.sh (npm não interativo)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git não interativo)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (ignorar integração inicial)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Por que o Git é necessário?">
    O Git é necessário para o método de instalação `git`. Para instalações `npm`, o Git ainda é verificado/instalado para evitar falhas de `spawn git ENOENT` quando as dependências usam URLs git.
  </Accordion>

  <Accordion title="Por que o npm encontra EACCES no Linux?">
    Algumas configurações do Linux apontam o prefixo global do npm para caminhos pertencentes ao root. `install.sh` pode alterar o prefixo para `~/.npm-global` e acrescentar exportações de PATH aos arquivos rc do shell (quando esses arquivos existirem).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Execute novamente o instalador para que ele possa inicializar o MinGit local do usuário ou instale o Git for Windows e reabra o PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Execute `npm config get prefix`, adicione esse diretório ao PATH do usuário (nenhum sufixo `\bin` é necessário no Windows) e reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: como obter uma saída detalhada do instalador">
    `install.ps1` não oferece um sinalizador `-Verbose`.
    Use o rastreamento do PowerShell para diagnósticos no nível do script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw não encontrado após a instalação">
    Geralmente, é um problema de PATH. Consulte [Solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Atualização](/pt-BR/install/updating)
- [Desinstalação](/pt-BR/install/uninstall)
