---
read_when:
    - Você quer entender `openclaw.ai/install.sh`
    - Você quer automatizar instalações (CI / sem interface gráfica)
    - Você quer instalar a partir de um checkout do GitHub
summary: Como funcionam os scripts de instalação (install.sh, install-cli.sh, install.ps1), opções e automação
title: Detalhes internos do instalador
x-i18n:
    generated_at: "2026-07-12T00:02:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

O OpenClaw disponibiliza três scripts de instalação, servidos por `openclaw.ai`.

| Script                             | Plataforma             | O que faz                                                                                              |
| ---------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)         | macOS / Linux / WSL    | Instala o Node se necessário, instala o OpenClaw via npm (padrão) ou git e pode executar a integração inicial. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL    | Instala o Node + OpenClaw em um prefixo local (`~/.openclaw`) via npm ou git. Não requer acesso root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell)   | Instala o Node se necessário, instala o OpenClaw via npm (padrão) ou git e pode executar a integração inicial. |

Todos os três oferecem suporte ao Node **22.19+, 23.11+ ou 24+**; o Node 24 é o destino padrão para novas instalações.

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
Se a instalação for concluída, mas `openclaw` não for encontrado em um novo terminal, consulte a [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
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
    Oferece suporte ao macOS e ao Linux (incluindo WSL).
  </Step>
  <Step title="Garantir o Node.js 24 por padrão">
    Verifica a versão do Node e instala o Node 24 se necessário (Homebrew no macOS, scripts de configuração do NodeSource no apt/dnf/yum do Linux). No macOS, o Homebrew é instalado somente quando o instalador precisa dele para o Node ou o Git. O Node 22.19+ e o 23.11+ continuam sendo compatíveis.
    No Alpine/Linux musl, o instalador usa pacotes apk em vez do NodeSource; os repositórios Alpine configurados devem fornecer uma versão compatível do Node (Alpine 3.21 ou mais recente no momento da redação).
  </Step>
  <Step title="Garantir o Git">
    Instala o Git caso esteja ausente usando o gerenciador de pacotes detectado, incluindo o Homebrew no macOS e o apk no Alpine.
  </Step>
  <Step title="Instalar o OpenClaw">
    - Método `npm` (padrão): instalação global pelo npm
    - Método `git`: clona/atualiza o repositório, instala as dependências com pnpm, compila e instala o wrapper em `~/.local/bin/openclaw`

  </Step>
  <Step title="Tarefas pós-instalação">
    - Localiza o binário `openclaw` recém-instalado para os comandos subsequentes
    - Em uma instalação não configurada, inicia a integração inicial antes das verificações do doctor ou do Gateway. Com `--no-onboard` ou sem TTY, exibe o comando para concluir a configuração posteriormente.
    - Em uma instalação configurada, atualiza e reinicia, na medida do possível, um serviço Gateway carregado e executa o doctor. As atualizações atualizam os plugins quando possível ou exibem o comando manual em uma execução sem interface com prompts habilitados.
    - Quando `--verify` é executado, verifica a versão instalada e a integridade do Gateway somente após existir uma configuração.

  </Step>
</Steps>

### Detecção de checkout do código-fonte

Se for executado dentro de um checkout do OpenClaw (`package.json` + `pnpm-workspace.yaml`), o script oferece:

- usar o checkout (`git`), ou
- usar a instalação global (`npm`)

Se não houver TTY disponível e nenhum método de instalação estiver definido, o padrão será `npm`, e um aviso será exibido.

O script encerra com o código `2` quando há uma seleção de método inválida ou valores inválidos para `--install-method`.

### Exemplos (install.sh)

<Tabs>
  <Tab title="Padrão">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Ignorar a integração inicial">
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

| Flag                                    | Descrição                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `--install-method \| --method npm\|git` | Escolhe o método de instalação (padrão: `npm`)                                 |
| `--npm`                                 | Atalho para o método npm                                                       |
| `--git \| --github`                     | Atalho para o método git                                                       |
| `--version <version\|dist-tag\|spec>`   | Versão, dist-tag ou especificação de pacote do npm (padrão: `latest`)          |
| `--beta`                                | Usa a dist-tag beta se disponível; caso contrário, volta para `latest`         |
| `--git-dir \| --dir <path>`             | Diretório do checkout (padrão: `~/openclaw`)                                   |
| `--no-git-update`                       | Ignora `git pull` para um checkout existente                                   |
| `--no-prompt`                           | Desabilita os prompts                                                          |
| `--no-onboard`                          | Ignora a integração inicial                                                    |
| `--onboard`                             | Habilita a integração inicial                                                  |
| `--verify`                              | Executa uma verificação rápida pós-instalação (`--version` e integridade do Gateway, se carregado) |
| `--dry-run`                             | Exibe as ações sem aplicar alterações                                          |
| `--verbose`                             | Habilita a saída de depuração (`set -x` e logs do npm no nível notice)         |
| `--help \| -h`                          | Exibe as instruções de uso                                                     |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                          | Descrição                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Método de instalação                                                             |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Versão, dist-tag ou especificação de pacote do npm                               |
| `OPENCLAW_BETA=0\|1`                              | Usa a versão beta, se disponível                                                 |
| `OPENCLAW_HOME=<path>`                            | Diretório-base para o estado do OpenClaw e os caminhos padrão de git/integração inicial |
| `OPENCLAW_GIT_DIR=<path>`                         | Diretório do checkout                                                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Ativa ou desativa as atualizações do git                                         |
| `OPENCLAW_NO_PROMPT=1`                            | Desabilita os prompts                                                            |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Executa a verificação rápida pós-instalação                                      |
| `OPENCLAW_NO_ONBOARD=1`                           | Ignora a integração inicial                                                      |
| `OPENCLAW_DRY_RUN=1`                              | Modo de simulação                                                                |
| `OPENCLAW_VERBOSE=1`                              | Modo de depuração                                                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Nível de log do npm (padrão: `error`, oculta o ruído de avisos de descontinuação do npm) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Projetado para ambientes nos quais você deseja manter tudo sob um prefixo local
(padrão: `~/.openclaw`) e sem dependência de uma instalação do Node no sistema. Oferece suporte a instalações pelo npm
por padrão, além de instalações por checkout do git no mesmo fluxo de prefixo.
</Info>

### Fluxo (install-cli.sh)

<Steps>
  <Step title="Instalar o runtime local do Node">
    Baixa um tarball fixado de uma versão LTS compatível do Node (a versão é incorporada ao script e atualizada de forma independente; o padrão é `22.22.2`) para `<prefix>/tools/node-v<version>` e verifica o SHA-256.
    No Alpine/Linux musl, para o qual o Node não publica tarballs compatíveis com o runtime fixado, instala `nodejs` e `npm` com `apk` e vincula esse runtime ao caminho do wrapper no prefixo. Os repositórios Alpine devem fornecer uma versão compatível do Node (22.19+, 23.11+ ou 24+); use o Alpine 3.21 ou mais recente se os repositórios antigos fornecerem apenas o Node 20 ou 21.
  </Step>
  <Step title="Garantir o Git">
    Se o Git estiver ausente, tenta instalá-lo via apt/dnf/yum/apk no Linux ou Homebrew no macOS.
  </Step>
  <Step title="Instalar o OpenClaw no prefixo">
    - Método `npm` (padrão): instala no prefixo com o npm e grava o wrapper em `<prefix>/bin/openclaw`
    - Método `git`: clona/atualiza um checkout (padrão: `~/openclaw`) e também grava o wrapper em `<prefix>/bin/openclaw`

  </Step>
  <Step title="Atualizar o serviço Gateway carregado">
    Se um serviço Gateway já estiver carregado a partir desse mesmo prefixo, o script executará
    `openclaw gateway install --force`, depois `openclaw gateway restart` e
    verificará a integridade do Gateway na medida do possível.
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
  <Tab title="Executar a integração inicial">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referência de flags">

| Flag                                    | Descrição                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Prefixo de instalação (padrão: `~/.openclaw`)                                                 |
| `--install-method \| --method npm\|git` | Escolhe o método de instalação (padrão: `npm`)                                                 |
| `--npm`                                 | Atalho para o método npm                                                                      |
| `--git \| --github`                     | Atalho para o método git                                                                      |
| `--git-dir \| --dir <path>`             | Diretório de checkout do Git (padrão: `~/openclaw`)                                            |
| `--version <ver>`                       | Versão ou dist-tag do OpenClaw (padrão: `latest`)                                              |
| `--node-version <ver>`                  | Versão do Node (padrão: `22.22.2`)                                                             |
| `--json`                                | Emite eventos NDJSON                                                                          |
| `--onboard`                             | Executa `openclaw onboard` após a instalação                                                   |
| `--no-onboard`                          | Ignora a integração inicial (padrão)                                                           |
| `--set-npm-prefix`                      | No Linux, força o prefixo do npm para `~/.npm-global` se não for possível gravar no prefixo atual |
| `--help \| -h`                          | Exibe as instruções de uso                                                                     |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                                    | Descrição                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Prefixo de instalação                                                               |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Método de instalação                                                                |
| `OPENCLAW_VERSION=<ver>`                    | Versão ou dist-tag do OpenClaw                                                      |
| `OPENCLAW_NODE_VERSION=<ver>`               | Versão do Node                                                                      |
| `OPENCLAW_HOME=<path>`                      | Diretório base para o estado do OpenClaw e os caminhos padrão de git/integração inicial |
| `OPENCLAW_GIT_DIR=<path>`                   | Diretório de checkout do Git para instalações via git                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Ativa ou desativa atualizações do git em checkouts existentes                       |
| `OPENCLAW_NO_ONBOARD=1`                     | Ignora a integração inicial                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Nível de log do npm (padrão: `error`)                                                |

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
    Requer PowerShell 5 ou posterior.
  </Step>
  <Step title="Garantir o Node.js 24 por padrão">
    Se estiver ausente, tenta instalá-lo via winget, depois Chocolatey e, por fim, Scoop. Se nenhum gerenciador de pacotes estiver disponível, o script baixa o arquivo zip oficial do Node.js 24 para Windows em `%LOCALAPPDATA%\OpenClaw\deps\portable-node` e o adiciona ao PATH do processo atual e do usuário. O Node 22.19 ou posterior e o 23.11 ou posterior continuam compatíveis.
  </Step>
  <Step title="Instalar o OpenClaw">
    - Método `npm` (padrão): instalação global via npm usando o `-Tag` selecionado, iniciada a partir de um diretório temporário gravável do instalador para que shells abertos em pastas protegidas, como `C:\`, continuem funcionando
    - Método `git`: clona/atualiza o repositório, instala/compila com pnpm e instala o wrapper em `%USERPROFILE%\.local\bin\openclaw.cmd`. Se o Git estiver ausente, o script inicializa o MinGit local do usuário em `%LOCALAPPDATA%\OpenClaw\deps\portable-git` e o adiciona ao PATH do processo atual e do usuário.

  </Step>
  <Step title="Executar tarefas pós-instalação">
    - Adiciona o diretório de binários necessário ao PATH do usuário quando possível
    - Atualiza, em caráter de melhor esforço, um serviço Gateway carregado (`openclaw gateway install --force` e, em seguida, reinicia)
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
  <Tab title="Checkout da branch main do GitHub">
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
  <Accordion title="Referência de flags">

| Flag                        | Descrição                                                         |
| --------------------------- | ----------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Método de instalação (padrão: `npm`)                              |
| `-Tag <tag\|version\|spec>` | Dist-tag, versão ou especificação de pacote npm (padrão: `latest`) |
| `-GitDir <path>`            | Diretório de checkout (padrão: `%USERPROFILE%\openclaw`)          |
| `-NoOnboard`                | Ignora a integração inicial                                       |
| `-NoGitUpdate`              | Ignora `git pull`                                                  |
| `-DryRun`                   | Apenas exibe as ações                                              |

  </Accordion>

  <Accordion title="Referência de variáveis de ambiente">

| Variável                           | Descrição             |
| ---------------------------------- | --------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Método de instalação  |
| `OPENCLAW_GIT_DIR=<path>`          | Diretório de checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Ignora a integração inicial |
| `OPENCLAW_GIT_UPDATE=0`            | Desativa o git pull   |
| `OPENCLAW_DRY_RUN=1`               | Modo de simulação     |

  </Accordion>
</AccordionGroup>

<Note>
Se `-InstallMethod git` for usado e o Git estiver ausente, o script tentará inicializar um MinGit local do usuário antes de exibir o link do Git for Windows.
</Note>

---

## CI e automação

Use flags/variáveis de ambiente não interativas para obter execuções previsíveis.

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
    O Git é necessário para o método de instalação `git`. Em instalações via `npm`, o Git ainda é verificado/instalado para evitar falhas `spawn git ENOENT` quando as dependências usam URLs git.
  </Accordion>

  <Accordion title="Por que o npm encontra EACCES no Linux?">
    Algumas configurações do Linux apontam o prefixo global do npm para caminhos pertencentes ao root. O `install.sh` pode alterar o prefixo para `~/.npm-global` e acrescentar exportações de PATH aos arquivos rc do shell (quando esses arquivos existem).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Execute novamente o instalador para que ele possa inicializar o MinGit local do usuário ou instale o Git for Windows e reabra o PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Execute `npm config get prefix` e adicione esse diretório ao PATH do usuário (nenhum sufixo `\bin` é necessário no Windows); em seguida, reabra o PowerShell.
  </Accordion>

  <Accordion title="Windows: como obter uma saída detalhada do instalador">
    O `install.ps1` não disponibiliza uma opção `-Verbose`.
    Use o rastreamento do PowerShell para diagnósticos no nível do script:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw não encontrado após a instalação">
    Geralmente, é um problema no PATH. Consulte [solução de problemas do Node.js](/pt-BR/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Atualização](/pt-BR/install/updating)
- [Desinstalação](/pt-BR/install/uninstall)
