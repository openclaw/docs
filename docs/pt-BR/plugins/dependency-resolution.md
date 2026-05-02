---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização de Plugin, do doctor ou de instalação do gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugin incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-02T05:52:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43d8008c837d519fd7c886f9615ad53941da340d753b559dfb0a32877716bc1f
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolução de dependências de Plugin

OpenClaw mantém o trabalho de dependências de plugins no momento de instalação/atualização. O carregamento em tempo de execução
não executa gerenciadores de pacotes, não repara árvores de dependências nem modifica o diretório de
pacotes do OpenClaw.

## Divisão de responsabilidades

Os pacotes de plugin são responsáveis pelo próprio grafo de dependências:

- dependências em tempo de execução ficam em `dependencies` ou
  `optionalDependencies` do pacote de plugin
- imports do SDK/core são peers ou imports fornecidos pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacotes pertencentes ao OpenClaw

OpenClaw é responsável apenas pelo ciclo de vida do plugin:

- descobrir a origem do plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados de instalação
- carregar o ponto de entrada do plugin
- falhar com um erro acionável quando faltarem dependências

## Raízes de instalação

OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas na raiz npm com:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

O npm pode elevar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote de plugin. OpenClaw verifica a raiz npm gerenciada antes de confiar na
instalação e usa npm para remover pacotes gerenciados por npm durante a desinstalação, então dependências
em tempo de execução elevadas permanecem dentro do limite de limpeza gerenciado.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O plugin instalado então carrega a partir desse diretório de pacote, então a resolução
local ao pacote e em `node_modules` pai funciona da mesma forma que em um pacote
Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um
plugin local tiver dependências, instale-as nesse plugin antes de carregá-lo.

Plugins locais TypeScript de terceiros podem usar o caminho de emergência Jiti. Plugins
JavaScript empacotados e plugins internos incluídos carregam por
import/require nativo em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento da configuração nunca instalam dependências de plugin. Eles leem
os registros de instalação do plugin, calculam o ponto de entrada e o carregam.

Se faltar uma dependência em tempo de execução, o plugin falha ao carregar e o erro
deve indicar ao operador uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado de dependências legado gerado pelo OpenClaw e instalar
plugins baixáveis configurados que estejam ausentes dos registros de instalação locais.
Ele não repara dependências de um plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o core são distribuídos como parte do OpenClaw.
Eles não devem ter uma árvore pesada de dependências em tempo de execução ou devem ser movidos para um
pacote baixável no ClawHub/npm.

Manifestos de plugins incluídos não devem solicitar preparação de dependências. Funcionalidade de plugin
grande ou opcional deve ser empacotada como um plugin normal e instalada pelo
mesmo caminho npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, OpenClaw trata o repositório como um monorepo pnpm. Depois de
`pnpm install`, plugins incluídos carregam de `extensions/<id>`, então dependências
de workspace locais ao pacote ficam disponíveis e edições são incorporadas diretamente. O desenvolvimento em
checkout de código-fonte é somente pnpm; `npm install` simples na raiz do repositório não é
uma forma compatível de preparar dependências de plugins incluídos.

| Formato de instalação            | Local do plugin incluído              | Responsável pelas dependências                                      |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime criada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de plugin |
| Checkout git mais `pnpm install` | Pacotes de workspace `extensions/<id>` | O workspace pnpm, incluindo as dependências próprias de cada pacote de plugin |
| `openclaw plugins install ...`   | Raiz de plugin gerenciada npm/git/ClawHub | O fluxo de instalação/atualização do plugin                         |

## Limpeza legada

Versões antigas do OpenClaw geravam raízes de dependências de plugins incluídos na inicialização ou
durante o reparo do doctor. A limpeza atual do doctor remove esses diretórios obsoletos e
symlinks quando `--fix` é usado, incluindo antigas raízes `plugin-runtime-deps`,
manifestos `.openclaw-runtime-deps*`, `node_modules` de plugin gerados, diretórios
de estágio de instalação e stores pnpm locais ao pacote.

Esses caminhos são apenas resíduos legados. Novas instalações não devem criá-los.
