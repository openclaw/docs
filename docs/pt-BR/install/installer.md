---
read_when:
    - Você quer entender `openclaw.ai/install.sh`
    - Você quer automatizar instalações (CI / sem interface)
    - Você quer instalar a partir de um checkout do GitHub
summary: Como os scripts de instalação funcionam (install.sh, install-cli.sh, install.ps1), flags e automação
title: Detalhes internos do instalador
x-i18n:
    generated_at: "2026-06-27T17:38:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw inclui três scripts de instalação, servidos a partir de `openclaw.ai`.

| Script                             | Plataforma           | O que ele faz                                                                                                  |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Instala Node se necessário, instala OpenClaw via npm (padrão) ou git, e pode executar o onboarding.            |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Instala Node + OpenClaw em um prefixo local (`~/.openclaw`) com modos npm ou checkout git. Não requer root.    |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Instala Node se necessário, instala OpenClaw via npm (padrão) ou git, e pode executar o onboarding.            |

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
Se a instalação for concluída, mas `openclaw` não for encontrado em um novo terminal, consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recomendado para a maioria das instalações interativas no macOS/Linux/WSL.
</Tip>

### Fluxo (install.sh)

<Steps>
  <Step title="Detectar SO">
    Compatível com macOS e Linux (incluindo WSL).
  </Step>
  <Step title="Garantir Node.js 24 por padrão">
    Verifica a versão do Node e instala Node 24 se necessário (Homebrew no macOS, scripts de configuração do NodeSource no Linux apt/dnf/yum). No macOS, o Homebrew é instalado somente quando o instalador precisa dele para Node ou Git. OpenClaw ainda oferece suporte ao Node 22 LTS, atualmente `22.19+`, para compatibilidade.
    No Alpine/musl Linux, o instalador usa pacotes apk em vez de NodeSource; os repositórios Alpine configurados devem fornecer Node `22.19+` (Alpine 3.21 ou mais recente no momento da escrita).
  </Step>
  <Step title="Garantir Git">
    Instala Git se estiver ausente usando o gerenciador de pacotes detectado, incluindo Homebrew no macOS e apk no Alpine.
  </Step>
  <Step title="Instalar OpenClaw">
    - método `npm` (padrão): instalação global com npm
    - método `git`: clona/atualiza o repositório, instala dependências com pnpm, compila e então instala o wrapper em `~/.local/bin/openclaw`

  </Step>
  <Step title="Tarefas pós-instalação">
    - Atualiza um serviço gateway carregado em modo melhor esforço (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em upgrades e instalações git (melhor esforço)
    - Tenta onboarding quando apropriado (TTY disponível, onboarding não desativado, e verificações de bootstrap/config passam)

  </Step>
</Steps>

### Detecção de checkout do código-fonte

Se executado dentro de um checkout do OpenClaw (`package.json` + `pnpm-workspace.yaml`), o script oferece:

- usar checkout (`git`), ou
- usar instalação global (`npm`)

Se nenhum TTY estiver disponível e nenhum método de instalação estiver definido, o padrão será `npm` e um aviso será exibido.

O script sai com código `2` para seleção de método inválida ou valores de `--install-method` inválidos.

### Exemplos (install.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Pular onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Instalação git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout do main no GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Execução de teste">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                                  | Descrição                                                  |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Escolhe o método de instalação (padrão: `npm`). Alias: `--method` |
| `--npm`                               | Atalho para o método npm                                   |
| `--git`                               | Atalho para o método git. Alias: `--github`                |
| `--version <version\|dist-tag\|spec>` | Versão npm, dist-tag ou especificação do pacote (padrão: `latest`) |
| `--beta`                              | Usa a dist-tag beta se disponível; caso contrário, fallback para `latest` |
| `--git-dir <path>`                    | Diretório do checkout (padrão: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Pula `git pull` para checkout existente                    |
| `--no-prompt`                         | Desativa prompts                                           |
| `--no-onboard`                        | Pula onboarding                                            |
| `--onboard`                           | Ativa onboarding                                           |
| `--dry-run`                           | Imprime ações sem aplicar alterações                       |
| `--verbose`                           | Ativa saída de depuração (`set -x`, logs npm no nível notice) |
| `--help`                              | Mostra o uso (`-h`)                                        |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                          | Descrição                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Método de instalação                                               |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versão npm, dist-tag ou especificação do pacote                    |
| `OPENCLAW_BETA=0\|1`                              | Usa beta se disponível                                             |
| `OPENCLAW_HOME=<path>`                            | Diretório base para estado do OpenClaw e caminhos git/onboarding padrão |
| `OPENCLAW_GIT_DIR=<path>`                         | Diretório do checkout                                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Alterna atualizações git                                           |
| `OPENCLAW_NO_PROMPT=1`                            | Desativa prompts                                                   |
| `OPENCLAW_NO_ONBOARD=1`                           | Pula onboarding                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Modo de execução de teste                                          |
| `OPENCLAW_VERBOSE=1`                              | Modo de depuração                                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Nível de log do npm                                                |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Projetado para ambientes nos quais você quer tudo sob um prefixo local
(padrão `~/.openclaw`) e nenhuma dependência de Node do sistema. Oferece suporte a instalações npm
por padrão, além de instalações por checkout git no mesmo fluxo de prefixo.
</Info>

### Fluxo (install-cli.sh)

<Steps>
  <Step title="Instalar runtime Node local">
    Baixa um tarball Node LTS compatível fixado (a versão é incorporada no script e atualizada independentemente) para `<prefix>/tools/node-v<version>` e verifica SHA-256.
    No Alpine/musl Linux, onde Node não publica tarballs compatíveis para o runtime fixado, instala `nodejs` e `npm` com `apk` e vincula esse runtime ao caminho do wrapper no prefixo. Os repositórios Alpine devem fornecer Node `22.19+`; use Alpine 3.21 ou mais recente se repositórios mais antigos fornecerem apenas Node 20 ou 21.
  </Step>
  <Step title="Garantir Git">
    Se Git estiver ausente, tenta instalar via apt/dnf/yum/apk no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Instalar OpenClaw sob o prefixo">
    - método `npm` (padrão): instala sob o prefixo com npm, depois grava o wrapper em `<prefix>/bin/openclaw`
    - método `git`: clona/atualiza um checkout (padrão `~/openclaw`) e ainda grava o wrapper em `<prefix>/bin/openclaw`

  </Step>
  <Step title="Atualizar serviço gateway carregado">
    Se um serviço gateway já estiver carregado a partir desse mesmo prefixo, o script executa
    `openclaw gateway install --force`, depois `openclaw gateway restart`, e
    testa a integridade do gateway em modo melhor esforço.
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
  <Tab title="Instalação git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Saída JSON para automação">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Executar onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                        | Descrição                                                                       |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefixo de instalação (padrão: `~/.openclaw`)                                   |
| `--install-method npm\|git` | Escolhe o método de instalação (padrão: `npm`). Apelido: `--method`             |
| `--npm`                     | Atalho para o método npm                                                        |
| `--git`, `--github`         | Atalho para o método git                                                        |
| `--git-dir <path>`          | Diretório de checkout do Git (padrão: `~/openclaw`). Apelido: `--dir`           |
| `--version <ver>`           | Versão ou dist-tag do OpenClaw (padrão: `latest`)                               |
| `--node-version <ver>`      | Versão do Node (padrão: `22.22.0`)                                              |
| `--json`                    | Emite eventos NDJSON                                                            |
| `--onboard`                 | Executa `openclaw onboard` após a instalação                                    |
| `--no-onboard`              | Ignora a integração inicial (padrão)                                            |
| `--set-npm-prefix`          | No Linux, força o prefixo npm para `~/.npm-global` se o prefixo atual não for gravável |
| `--help`                    | Mostra o uso (`-h`)                                                             |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variável                                    | Descrição                                                          |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Prefixo de instalação                                              |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalação                                               |
| `OPENCLAW_VERSION=<ver>`                    | Versão ou dist-tag do OpenClaw                                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versão do Node                                                     |
| `OPENCLAW_HOME=<path>`                      | Diretório base para o estado do OpenClaw e caminhos padrão de git/integração inicial |
| `OPENCLAW_GIT_DIR=<path>`                   | Diretório de checkout do Git para instalações via git              |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Alterna atualizações do git para checkouts existentes              |
| `OPENCLAW_NO_ONBOARD=1`                     | Ignora a integração inicial                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm                                                |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Fluxo (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    Requer PowerShell 5+.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Se estiver ausente, tenta instalar via winget, depois Chocolatey e depois Scoop. Se nenhum gerenciador de pacotes estiver disponível, o script baixa o zip oficial do Node.js para Windows em `%LOCALAPPDATA%\OpenClaw\deps\portable-node` e o adiciona ao PATH do processo atual e do usuário. O Node 22 LTS, atualmente `22.19+`, continua compatível.
  </Step>
  <Step title="Install OpenClaw">
    - Método `npm` (padrão): instalação global do npm usando o `-Tag` selecionado, iniciada a partir de um diretório temporário gravável do instalador para que shells abertos em pastas protegidas, como `C:\`, ainda funcionem
    - Método `git`: clona/atualiza o repositório, instala/compila com pnpm e instala o wrapper em `%USERPROFILE%\.local\bin\openclaw.cmd`. Se o Git estiver ausente, o script inicializa um MinGit local do usuário em `%LOCALAPPDATA%\OpenClaw\deps\portable-git` e o adiciona ao PATH do processo atual e do usuário.

  </Step>
  <Step title="Post-install tasks">
    - Adiciona o diretório bin necessário ao PATH do usuário quando possível
    - Atualiza um serviço Gateway carregado em modo de melhor esforço (`openclaw gateway install --force`, depois reinicia)
    - Executa `openclaw doctor --non-interactive` em atualizações e instalações via git (melhor esforço)

  </Step>
  <Step title="Handle failures">
    Instalações com `iwr ... | iex` e scriptblock relatam um erro terminativo sem fechar a sessão atual do PowerShell. Instalações diretas com `powershell -File` / `pwsh -File` ainda saem com código diferente de zero para automação.
  </Step>
</Steps>

### Exemplos (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Descrição                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalação (padrão: `npm`)                       |
| `-Tag <tag\|version\|spec>` | dist-tag, versão ou especificação de pacote npm (padrão: `latest`) |
| `-GitDir <path>`            | Diretório de checkout (padrão: `%USERPROFILE%\openclaw`)   |
| `-NoOnboard`                | Ignora a integração inicial                                |
| `-NoGitUpdate`              | Ignora `git pull`                                          |
| `-DryRun`                   | Imprime apenas as ações                                    |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variável                           | Descrição                |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalação     |
| `OPENCLAW_GIT_DIR=<path>`          | Diretório de checkout    |
| `OPENCLAW_NO_ONBOARD=1`            | Ignora a integração inicial |
| `OPENCLAW_GIT_UPDATE=0`            | Desativa git pull        |
| `OPENCLAW_DRY_RUN=1`               | Modo dry run             |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git estiver ausente, o script tenta inicializar um MinGit local do usuário antes de imprimir o link do Git for Windows.
</Note>

---

## CI e automação

Use flags/variáveis de ambiente não interativas para execuções previsíveis.

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
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
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Why is Git required?">
    O Git é necessário para o método de instalação `git`. Para instalações `npm`, o Git ainda é verificado/instalado para evitar falhas `spawn git ENOENT` quando dependências usam URLs git.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    Algumas configurações do Linux apontam o prefixo global do npm para caminhos pertencentes ao root. `install.sh` pode trocar o prefixo para `~/.npm-global` e anexar exportações de PATH aos arquivos rc do shell (quando esses arquivos existem).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Execute novamente o instalador para que ele possa inicializar o MinGit local do usuário ou instale o Git for Windows e reabra o PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Execute `npm config get prefix` e adicione esse diretório ao PATH do usuário (sem necessidade do sufixo `\bin` no Windows), depois reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    Atualmente, `install.ps1` não expõe um switch `-Verbose`.
    Use o rastreamento do PowerShell para diagnósticos no nível do script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    Geralmente é um problema de PATH. Consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Atualização](/pt-BR/install/updating)
- [Desinstalação](/pt-BR/install/uninstall)
