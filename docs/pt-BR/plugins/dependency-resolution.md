---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização de Plugin, do doctor ou de instalação do gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugin incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolução de dependências de Plugin

O OpenClaw mantém o trabalho de dependências de plugin no momento de instalação/atualização. O carregamento em runtime
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório de pacote do OpenClaw.

## Divisão de responsabilidades

Os pacotes de plugin são responsáveis pelo próprio grafo de dependências:

- dependências de runtime ficam em `dependencies` ou
  `optionalDependencies` do pacote de plugin
- importações do SDK/core são peers ou importações fornecidas pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacote pertencentes ao OpenClaw

O OpenClaw é responsável apenas pelo ciclo de vida do plugin:

- descobrir a origem do plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados de instalação
- carregar o entrypoint do plugin
- falhar com um erro acionável quando faltarem dependências

## Raízes de instalação

O OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas na raiz npm com:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

O npm pode içar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote de plugin. O OpenClaw examina a raiz npm gerenciada antes de confiar na
instalação e usa npm para remover pacotes gerenciados por npm durante a desinstalação, então dependências
de runtime içadas permanecem dentro do limite de limpeza gerenciado.

Instalações git clonam ou atualizam o repositório e depois executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O plugin instalado então é carregado a partir desse diretório de pacote, então a resolução
em `node_modules` local ao pacote e pai funciona da mesma forma que em um pacote
Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. O OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um
plugin local tiver dependências, instale-as nesse plugin antes de carregá-lo.

Plugins locais TypeScript de terceiros podem usar o caminho emergencial Jiti. Plugins
JavaScript empacotados e plugins internos incluídos carregam por import/require
nativo em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de plugin. Eles leem
os registros de instalação do plugin, calculam o entrypoint e o carregam.

Se uma dependência estiver ausente em runtime, o plugin falha ao carregar e o erro
deve apontar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado legado de dependências gerado pelo OpenClaw e instalar
plugins baixáveis configurados que estejam ausentes dos registros de instalação locais.
Ele não repara dependências de um plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o core são enviados como parte do OpenClaw.
Eles devem não ter uma árvore pesada de dependências de runtime ou ser movidos para um
pacote baixável no ClawHub/npm.

Para a lista gerada atual de plugins enviados no pacote core, instalados
externamente ou mantidos apenas como fonte, consulte [Inventário de plugins](/pt-BR/plugins/plugin-inventory).

Manifestos de plugins incluídos não devem solicitar staging de dependências. Funcionalidade grande ou opcional
de plugin deve ser empacotada como um plugin normal e instalada pelo
mesmo caminho npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, o OpenClaw trata o repositório como um monorepo pnpm. Depois de
`pnpm install`, plugins incluídos carregam de `extensions/<id>`, então dependências
workspace locais ao pacote ficam disponíveis e edições são aplicadas diretamente. O desenvolvimento em
checkout de código-fonte é somente pnpm; `npm install` simples na raiz do repositório não é
uma forma compatível de preparar dependências de plugins incluídos.

| Forma de instalação              | Local do plugin incluído              | Responsável pelas dependências                                      |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime construída dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de plugins |
| Checkout git mais `pnpm install` | Pacotes workspace em `extensions/<id>` | O workspace pnpm, incluindo as dependências próprias de cada pacote de plugin |
| `openclaw plugins install ...`   | Raiz gerenciada de plugin npm/git/ClawHub | O fluxo de instalação/atualização de plugin                          |

## Limpeza legada

Versões antigas do OpenClaw geravam raízes de dependências de plugins incluídos na inicialização ou
durante reparo do doctor. A limpeza atual do doctor remove esses diretórios obsoletos e
symlinks quando `--fix` é usado, incluindo antigas raízes `plugin-runtime-deps`, symlinks de pacote
do prefixo global do Node que apontam para destinos `plugin-runtime-deps` podados,
manifestos `.openclaw-runtime-deps*`, `node_modules` de plugin gerados, diretórios de estágio
de instalação e stores pnpm locais ao pacote. O postinstall empacotado também
remove esses symlinks globais antes de podar as raízes de destino legadas para que upgrades
não deixem importações de pacotes ESM pendentes.

Esses caminhos são apenas resíduos legados. Novas instalações não devem criá-los.
