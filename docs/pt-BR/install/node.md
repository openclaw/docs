---
read_when:
    - Você precisa instalar o Node.js antes de instalar o OpenClaw
    - 'Você instalou o OpenClaw, mas `openclaw`: comando não encontrado'
    - npm install -g falha devido a problemas de permissão ou de PATH
summary: Instale e configure o Node.js para o OpenClaw — requisitos de versão, opções de instalação e solução de problemas do PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-12T15:18:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw requer **Node 22.19+, Node 23.11+ ou Node 24+**. **Node 24 é o ambiente de execução padrão e recomendado** para instalações, CI e fluxos de trabalho de lançamento; o Node 22 continua sendo compatível por meio da linha LTS ativa. O [script de instalação](/pt-BR/install#alternative-install-methods) detecta e instala o Node automaticamente — use esta página quando quiser configurar o Node por conta própria (versões, PATH, instalações globais).

## Verifique sua versão

```bash
node -v
```

`v24.x.x` ou superior é o padrão recomendado. `v22.19.x` ou superior é a versão compatível da linha Node 22 LTS (atualize para o Node 24 quando for conveniente). Builds do Node 23 anteriores à `v23.11.0` não são compatíveis. Se o Node não estiver instalado ou estiver fora do intervalo compatível, escolha um método de instalação abaixo.

## Instale o Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recomendado):

    ```bash
    brew install node
    ```

    Ou baixe o instalador para macOS em [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Ou use um gerenciador de versões (veja abaixo).

  </Tab>
  <Tab title="Windows">
    **winget** (recomendado):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Ou baixe o instalador para Windows em [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Como usar um gerenciador de versões (nvm, fnm, mise, asdf)">
  Os gerenciadores de versões permitem alternar facilmente entre versões do Node. Opções populares:

- [**fnm**](https://github.com/Schniz/fnm) - rápido e multiplataforma
- [**nvm**](https://github.com/nvm-sh/nvm) - amplamente utilizado no macOS/Linux
- [**mise**](https://mise.jdx.dev/) - poliglota (Node, Python, Ruby etc.)

Exemplo com fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Inicialize seu gerenciador de versões no arquivo de inicialização do shell (`~/.zshrc` ou `~/.bashrc`). Se você pular esta etapa, o `openclaw` poderá não ser encontrado em novas sessões do terminal, pois o PATH não incluirá o diretório bin do Node.
  </Warning>
</Accordion>

## Solução de problemas

### `openclaw: command not found`

Isso quase sempre significa que o diretório bin global do npm não está no PATH.

<Steps>
  <Step title="Encontre o prefixo global do npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Verifique se ele está no PATH">
    ```bash
    echo "$PATH"
    ```

    Procure por `<npm-prefix>/bin` (macOS/Linux) ou `<npm-prefix>` (Windows) na saída.

  </Step>
  <Step title="Adicione-o ao arquivo de inicialização do shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Adicione a `~/.zshrc` ou `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Em seguida, abra um novo terminal (ou execute `rehash` no zsh / `hash -r` no bash).
      </Tab>
      <Tab title="Windows">
        Adicione a saída de `npm prefix -g` ao PATH do sistema em Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erros de permissão em `npm install -g` (Linux)

Se você encontrar erros `EACCES`, altere o prefixo global do npm para um diretório no qual o usuário tenha permissão de gravação:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Adicione a linha `export PATH=...` ao seu `~/.bashrc` ou `~/.zshrc` para tornar a alteração permanente.

## Relacionados

- [Visão geral da instalação](/pt-BR/install) - todos os métodos de instalação
- [Atualização](/pt-BR/install/updating) - como manter o OpenClaw atualizado
- [Primeiros passos](/pt-BR/start/getting-started) - primeiras etapas após a instalação
