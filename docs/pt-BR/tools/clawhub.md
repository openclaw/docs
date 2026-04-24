---
read_when:
    - Apresentar o ClawHub a novos usuários
    - Instalar, pesquisar ou publicar Skills ou plugins
    - Explicar flags da CLI do ClawHub e comportamento de sincronização
summary: 'Guia do ClawHub: registro público, fluxos nativos de instalação do OpenClaw e fluxos da CLI do ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-24T06:15:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub é o registro público para **Skills e plugins do OpenClaw**.

- Use comandos nativos do `openclaw` para pesquisar/instalar/atualizar Skills e instalar
  plugins a partir do ClawHub.
- Use a CLI separada `clawhub` quando precisar de autenticação no registro, publicar, excluir,
  restaurar exclusão ou fluxos de sincronização.

Site: [clawhub.ai](https://clawhub.ai)

## Fluxos nativos do OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Especificações simples de plugin seguras para npm também são tentadas no ClawHub antes do npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Comandos nativos do `openclaw` instalam no workspace ativo e persistem metadados de origem
para que chamadas posteriores de `update` possam permanecer no ClawHub.

Instalações de Plugin validam a compatibilidade anunciada de `pluginApi` e `minGatewayVersion`
antes de a instalação do arquivo ocorrer, para que hosts incompatíveis falhem de forma fechada logo no início, em vez de instalar parcialmente o pacote.

`openclaw plugins install clawhub:...` aceita apenas famílias de plugins instaláveis.
Se um pacote do ClawHub for na verdade uma Skill, o OpenClaw interrompe e direciona você para
`openclaw skills install <slug>`.

## O que é o ClawHub

- Um registro público para Skills e plugins do OpenClaw.
- Um armazenamento versionado de bundles de Skill e metadados.
- Uma superfície de descoberta para pesquisa, tags e sinais de uso.

## Como funciona

1. Um usuário publica um bundle de Skill (arquivos + metadados).
2. O ClawHub armazena o bundle, faz parse dos metadados e atribui uma versão.
3. O registro indexa a Skill para pesquisa e descoberta.
4. Usuários navegam, baixam e instalam Skills no OpenClaw.

## O que você pode fazer

- Publicar novas Skills e novas versões de Skills existentes.
- Descobrir Skills por nome, tags ou pesquisa.
- Baixar bundles de Skill e inspecionar seus arquivos.
- Reportar Skills abusivas ou inseguras.
- Se você for moderador, ocultar, reexibir, excluir ou banir.

## Para quem isso é (amigável para iniciantes)

Se você quiser adicionar novas capacidades ao seu agente OpenClaw, o ClawHub é a forma mais fácil de encontrar e instalar Skills. Você não precisa saber como o backend funciona. Você pode:

- Pesquisar Skills em linguagem natural.
- Instalar uma Skill no seu workspace.
- Atualizar Skills depois com um único comando.
- Fazer backup das suas próprias Skills publicando-as.

## Início rápido (não técnico)

1. Pesquise algo de que você precisa:
   - `openclaw skills search "calendar"`
2. Instale uma Skill:
   - `openclaw skills install <skill-slug>`
3. Inicie uma nova sessão do OpenClaw para que ele reconheça a nova Skill.
4. Se quiser publicar ou gerenciar autenticação do registro, instale também a CLI separada
   `clawhub`.

## Instalar a CLI do ClawHub

Você só precisa dela para fluxos autenticados no registro, como publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Como isso se encaixa no OpenClaw

`openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. `openclaw plugins install clawhub:...` registra uma instalação normal gerenciada de plugin mais metadados de origem do ClawHub para atualizações.

Instalações anônimas de plugins do ClawHub também falham de forma fechada para pacotes privados.
Canais da comunidade ou outros canais não oficiais ainda podem instalar, mas o OpenClaw emite um aviso
para que operadores revisem a origem e a verificação antes de ativar.

A CLI separada `clawhub` também instala Skills em `./skills` no diretório de trabalho atual. Se um workspace do OpenClaw estiver configurado, `clawhub`
usa esse workspace como fallback, a menos que você substitua com `--workdir` (ou
`CLAWHUB_WORKDIR`). O OpenClaw carrega Skills do workspace em `<workspace>/skills`
e as reconhecerá na **próxima** sessão. Se você já usa
`~/.openclaw/skills` ou Skills empacotadas, Skills do workspace têm precedência.

Para mais detalhes sobre como Skills são carregadas, compartilhadas e bloqueadas, consulte
[Skills](/pt-BR/tools/skills).

## Visão geral do sistema de Skills

Uma Skill é um bundle versionado de arquivos que ensina o OpenClaw a executar
uma tarefa específica. Cada publicação cria uma nova versão, e o registro mantém
um histórico de versões para que usuários possam auditar mudanças.

Uma Skill típica inclui:

- Um arquivo `SKILL.md` com a descrição principal e uso.
- Configurações, scripts ou arquivos de suporte opcionais usados pela Skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para alimentar a descoberta e expor com segurança recursos de Skill.
O registro também rastreia sinais de uso (como estrelas e downloads) para melhorar
ranqueamento e visibilidade.

## O que o serviço oferece (recursos)

- **Navegação pública** por Skills e seu conteúdo `SKILL.md`.
- **Pesquisa** com embeddings (busca vetorial), não apenas palavras-chave.
- **Versionamento** com semver, changelogs e tags (incluindo `latest`).
- **Downloads** como zip por versão.
- **Estrelas e comentários** para feedback da comunidade.
- **Hooks de moderação** para aprovações e auditorias.
- **API amigável para CLI** para automação e scripts.

## Segurança e moderação

O ClawHub é aberto por padrão. Qualquer pessoa pode enviar Skills, mas uma conta GitHub precisa
ter pelo menos uma semana de existência para publicar. Isso ajuda a reduzir abuso sem bloquear
contribuidores legítimos.

Reportes e moderação:

- Qualquer usuário autenticado pode reportar uma Skill.
- Motivos de reporte são obrigatórios e registrados.
- Cada usuário pode ter até 20 reportes ativos ao mesmo tempo.
- Skills com mais de 3 reportes únicos são ocultadas automaticamente por padrão.
- Moderadores podem ver Skills ocultadas, reexibi-las, excluí-las ou banir usuários.
- Abusar da funcionalidade de reporte pode resultar em banimento da conta.

Interessado em se tornar moderador? Pergunte no Discord do OpenClaw e entre em contato com um
moderador ou mantenedor.

## Comandos e parâmetros da CLI

Opções globais (aplicam-se a todos os comandos):

- `--workdir <dir>`: diretório de trabalho (padrão: diretório atual; usa fallback para o workspace do OpenClaw).
- `--dir <dir>`: diretório de Skills, relativo ao workdir (padrão: `skills`).
- `--site <url>`: URL base do site (login via navegador).
- `--registry <url>`: URL base da API do registro.
- `--no-input`: desativa prompts (não interativo).
- `-V, --cli-version`: imprime a versão da CLI.

Autenticação:

- `clawhub login` (fluxo via navegador) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opções:

- `--token <token>`: cole um token de API.
- `--label <label>`: rótulo armazenado para tokens de login via navegador (padrão: `CLI token`).
- `--no-browser`: não abre um navegador (exige `--token`).

Pesquisa:

- `clawhub search "query"`
- `--limit <n>`: máximo de resultados.

Instalação:

- `clawhub install <slug>`
- `--version <version>`: instala uma versão específica.
- `--force`: sobrescreve se a pasta já existir.

Atualização:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: atualiza para uma versão específica (apenas slug único).
- `--force`: sobrescreve quando arquivos locais não correspondem a nenhuma versão publicada.

Listagem:

- `clawhub list` (lê `.clawhub/lock.json`)

Publicar Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: slug da Skill.
- `--name <name>`: nome de exibição.
- `--version <version>`: versão semver.
- `--changelog <text>`: texto do changelog (pode ser vazio).
- `--tags <tags>`: tags separadas por vírgula (padrão: `latest`).

Publicar plugins:

- `clawhub package publish <source>`
- `<source>` pode ser uma pasta local, `owner/repo`, `owner/repo@ref` ou uma URL GitHub.
- `--dry-run`: cria o plano exato de publicação sem enviar nada.
- `--json`: emite saída legível por máquina para CI.
- `--source-repo`, `--source-commit`, `--source-ref`: substituições opcionais quando a autodetecção não for suficiente.

Excluir/restaurar exclusão (apenas proprietário/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sincronização (varrer Skills locais + publicar novas/atualizadas):

- `clawhub sync`
- `--root <dir...>`: raízes extras de varredura.
- `--all`: envia tudo sem prompts.
- `--dry-run`: mostra o que seria enviado.
- `--bump <type>`: `patch|minor|major` para atualizações (padrão: `patch`).
- `--changelog <text>`: changelog para atualizações não interativas.
- `--tags <tags>`: tags separadas por vírgula (padrão: `latest`).
- `--concurrency <n>`: verificações no registro (padrão: 4).

## Fluxos comuns para agentes

### Pesquisar Skills

```bash
clawhub search "postgres backups"
```

### Baixar novas Skills

```bash
clawhub install my-skill-pack
```

### Atualizar Skills instaladas

```bash
clawhub update --all
```

### Fazer backup das suas Skills (publish ou sync)

Para uma única pasta de Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Para varrer e fazer backup de várias Skills de uma vez:

```bash
clawhub sync --all
```

### Publicar um Plugin do GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Plugins de código devem incluir os metadados exigidos do OpenClaw em `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Pacotes publicados devem incluir JavaScript compilado e apontar `runtimeExtensions`
para essa saída. Instalações por checkout git ainda podem usar fallback para código TypeScript
quando não existirem arquivos compilados, mas entradas de runtime compiladas evitam
compilação TypeScript em runtime nos caminhos de inicialização, doctor e carregamento de plugin.

## Detalhes avançados (técnicos)

### Versionamento e tags

- Cada publicação cria uma nova `SkillVersion` **semver**.
- Tags (como `latest`) apontam para uma versão; mover tags permite rollback.
- Changelogs são anexados por versão e podem ficar vazios ao sincronizar ou publicar atualizações.

### Mudanças locais vs versões do registro

Atualizações comparam o conteúdo local da Skill com versões do registro usando um hash de conteúdo. Se os arquivos locais não corresponderem a nenhuma versão publicada, a CLI pergunta antes de sobrescrever (ou exige `--force` em execuções não interativas).

### Varredura de sync e raízes de fallback

`clawhub sync` varre primeiro seu workdir atual. Se nenhuma Skill for encontrada, ele usa fallback para localizações legadas conhecidas (por exemplo `~/openclaw/skills` e `~/.openclaw/skills`). Isso foi projetado para encontrar instalações antigas de Skill sem flags extras.

### Armazenamento e lockfile

- Skills instaladas são registradas em `.clawhub/lock.json` no seu workdir.
- Tokens de autenticação são armazenados no arquivo de configuração da CLI do ClawHub (substitua com `CLAWHUB_CONFIG_PATH`).

### Telemetria (contagem de instalações)

Quando você executa `clawhub sync` autenticado, a CLI envia um snapshot mínimo para calcular contagens de instalação. Você pode desativar isso completamente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variáveis de ambiente

- `CLAWHUB_SITE`: substitui a URL do site.
- `CLAWHUB_REGISTRY`: substitui a URL da API do registro.
- `CLAWHUB_CONFIG_PATH`: substitui onde a CLI armazena o token/configuração.
- `CLAWHUB_WORKDIR`: substitui o workdir padrão.
- `CLAWHUB_DISABLE_TELEMETRY=1`: desativa telemetria em `sync`.

## Relacionado

- [Plugin](/pt-BR/tools/plugin)
- [Skills](/pt-BR/tools/skills)
- [Plugins da comunidade](/pt-BR/plugins/community)
