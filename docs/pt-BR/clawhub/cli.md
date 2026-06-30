---
read_when:
    - Usando a CLI do ClawHub
    - Depurando instalação, atualização ou publicação
summary: 'Referência da CLI: comandos, flags, configuração e comportamento de lockfile.'
x-i18n:
    generated_at: "2026-06-30T22:08:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119900fddb8c80213eb12060c07026527a1ff851546c632bf1f7a909659b1945
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

Pacote CLI: `clawhub`, binário: `clawhub`.

Instale-o globalmente com npm ou pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Depois verifique:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Flags globais

- `--workdir <dir>`: diretório de trabalho (padrão: cwd; usa o workspace do Clawdbot como alternativa se configurado)
- `--dir <dir>`: diretório de instalação dentro de workdir (padrão: `skills`)
- `--site <url>`: URL base para login no navegador (padrão: `https://clawhub.ai`)
- `--registry <url>`: URL base da API (padrão: descoberta; caso contrário, `https://clawhub.ai`)
- `--no-input`: desabilita prompts

Equivalentes de ambiente:

- `CLAWHUB_SITE` (legado `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (legado `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (legado `CLAWDHUB_WORKDIR`)

### Proxy HTTP

A CLI respeita variáveis de ambiente padrão de proxy HTTP para sistemas atrás de
proxies corporativos ou redes restritas:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Quando qualquer uma dessas variáveis está definida, a CLI roteia solicitações de saída pelo
proxy especificado. `HTTPS_PROXY` é usado para solicitações HTTPS, `HTTP_PROXY`
para HTTP simples. `NO_PROXY` / `no_proxy` é respeitado para ignorar o proxy para
hosts ou domínios específicos.

Isso é necessário em sistemas nos quais conexões diretas de saída são bloqueadas
(por exemplo, contêineres Docker, VPS Hetzner com internet apenas por proxy, firewalls
corporativos).

Exemplo:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Quando nenhuma variável de proxy está definida, o comportamento não muda (conexões diretas).

## Arquivo de configuração

Armazena seu token de API + URL de registro em cache.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` ou `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Alternativa legada: se `clawhub/config.json` ainda não existir, mas `clawdhub/config.json` existir, a CLI reutiliza o caminho legado
- substituição: `CLAWHUB_CONFIG_PATH` (legado `CLAWDHUB_CONFIG_PATH`)

## Comandos

### `login` / `auth login`

- Padrão: abre o navegador em `<site>/cli/auth` e conclui via callback de local loopback.
- Sem interface gráfica: `clawhub login --token clh_...`
- Interativo remoto/sem interface gráfica: `clawhub login --device` imprime um código e aguarda enquanto você o autoriza em `<site>/cli/device`.

### `whoami`

- Verifica o token armazenado via `/api/v1/whoami`.

### `token`

- Imprime o token de API armazenado em stdout.
- Útil para encaminhar um token de login local para comandos de configuração de segredos de CI.

### `star <skill>` / `unstar <skill>`

- Adiciona/remove uma Skill dos seus destaques.
- Chama `POST /api/v1/stars/<slug>` e `DELETE /api/v1/stars/<slug>`.
- `--yes` ignora a confirmação.

### `search <query...>`

- Chama `/api/v1/search?q=...`.
- A saída inclui o slug da Skill, identificador do proprietário, nome de exibição e pontuação de relevância.
- A busca favorece correspondências exatas de tokens de slug/nome antes da popularidade de downloads. Um token de slug independente como `map` corresponde a `personal-map` com mais força do que à substring dentro de `amap`.
- A popularidade é um pequeno fator prévio de classificação, não uma garantia de primeira posição.
- Se uma Skill deve aparecer, mas não aparece, execute `clawhub inspect @owner/slug` enquanto estiver conectado para verificar diagnósticos de moderação visíveis ao proprietário antes de renomear metadados.

### `explore`

- Lista as Skills mais recentes via `/api/v1/skills?limit=...&sort=createdAt` (ordenadas por `createdAt` desc).
- Flags:
  - `--limit <n>` (1-200, padrão: 25)
  - `--sort newest|updated|rating|downloads|trending` (padrão: newest). Aliases legados de ordenação de instalação ainda funcionam por compatibilidade.
  - `--json` (saída legível por máquina)
- Saída: `<slug>  v<version>  <age>  <summary>` (resumo truncado para 50 caracteres).

### `inspect @owner/slug`

- Busca metadados da Skill e arquivos de versão sem instalar.
- `--version <version>`: inspeciona uma versão específica (padrão: mais recente).
- `--tag <tag>`: inspeciona uma versão marcada (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-200).
- `--files`: lista arquivos da versão selecionada.
- `--file <path>`: busca o conteúdo bruto do arquivo (apenas arquivos de texto; limite de 200 KB).
- `--json`: saída legível por máquina.

### `install @owner/slug`

- Resolve a versão mais recente para o proprietário e a Skill nomeados.
- Baixa o zip via `/api/v1/download`.
- Extrai para `<workdir>/<dir>/<slug>`.
- Recusa sobrescrever Skills fixadas; execute `clawhub unpin <skill>` primeiro.
- Grava:
  - `<workdir>/.clawhub/lock.json` (legado `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (legado `.clawdhub`)

### `uninstall <skill>`

- Remove `<workdir>/<dir>/<slug>` e exclui a entrada do lockfile.
- Envia telemetria em melhor esforço enquanto conectado para que contagens de instalação atuais possam ser
  desativadas.
- Interativo: pede confirmação.
- Não interativo (`--no-input`): exige `--yes`.

### `list`

- Lê `<workdir>/.clawhub/lock.json` (legado `.clawdhub`).
- Mostra `pinned` ao lado de Skills congeladas com `clawhub pin`, incluindo o motivo opcional.

### `pin <skill>`

- Marca uma Skill instalada como fixada no lockfile.
- `--reason <text>` registra por que a Skill está congelada.
- Skills fixadas são ignoradas por `update --all` e rejeitadas por `update <skill>` direto.
- Skills fixadas também rejeitam `install --force`, para que os bytes locais não possam ser substituídos acidentalmente.

### `unpin <skill>`

- Remove a fixação do lockfile de uma Skill instalada para que atualizações futuras possam modificá-la.

### `update [@owner/slug]` / `update --all`

- Calcula a impressão digital a partir dos arquivos locais.
- Se a impressão digital corresponder a uma versão conhecida: nenhum prompt.
- Se a impressão digital não corresponder:
  - recusa por padrão
  - sobrescreve com `--force` (ou prompt, se interativo)
- Skills fixadas nunca são atualizadas por `--force`.
- `update <skill>` falha rapidamente para Skills fixadas e informa que você deve executar `clawhub unpin <skill>` primeiro.
- `update --all` ignora slugs fixados e imprime um resumo do que permaneceu congelado.

### `skill publish <path>`

- Compara a impressão digital do pacote local com o ClawHub e sai com sucesso quando
  o conteúdo já está publicado.
- Novas Skills usam `1.0.0` por padrão; Skills alteradas usam por padrão a próxima
  versão de patch.
- `--version <version>` seleciona explicitamente uma versão e publica mesmo quando o
  conteúdo corresponde a uma versão existente.
- `--dry-run` resolve a publicação sem enviar; `--json` imprime um
  resultado legível por máquina.
- `--owner <handle>` publica sob um identificador de publicador de organização/usuário quando o
  ator tem acesso de publicador.
- `--migrate-owner` move uma Skill existente para `--owner` enquanto publica uma nova
  versão. Exige acesso de administrador/proprietário nos dois publicadores.
- O comportamento de proprietário e revisão é explicado em `docs/publishing.md`.
- Publicar uma Skill significa que ela é lançada sob `MIT-0` no ClawHub.
- Skills publicadas são livres para usar, modificar e redistribuir sem atribuição.
- O ClawHub não oferece suporte a Skills pagas nem a preços por Skill.
- Alias legado: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

O workflow reutilizável
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
do ClawHub chama `skill publish` para um `skill_path`, ou para cada pasta de Skill imediata
em `root` (padrão: `skills`). Ele ignora Skills inalteradas e usa o
mesmo comportamento automático de versão de patch.

Defina `dry_run: true` para pré-visualizar sem um token. Publicações reais exigem o
segredo `clawhub_token`.

### `sync`

- Varre o workdir atual, o diretório de Skills configurado e quaisquer
  pastas `--root <dir>` em busca de pastas de Skills locais contendo `SKILL.md` ou
  `skill.md`.
- Compara cada impressão digital de Skill local com o ClawHub e publica apenas Skills novas ou
  alteradas.
- Novas Skills são publicadas como `1.0.0`; Skills alteradas publicam a próxima versão de patch
  por padrão. Use `--bump minor|major` para lotes de atualização que devem avançar por uma
  etapa semver maior.
- `--dry-run` mostra o plano de publicação sem enviar; `--json` imprime um
  plano legível por máquina.
- `--all` publica toda Skill nova ou alterada sem prompt. Sem
  `--all`, terminais interativos permitem selecionar as Skills a publicar.
- `--owner <handle>` publica sob um identificador de publicador de organização/usuário quando o
  ator tem acesso de publicador.
- `sync` é apenas publicação unidirecional. Ele não instala, atualiza, baixa nem
  informa telemetria de instalação/download.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Exige `clawhub login`.
- Executa o ClawScan do ClawHub via `POST /api/v1/skills/-/scan` e depois consulta até que a varredura seja terminal.
- As varreduras são assíncronas e podem levar tempo para concluir. Enquanto estiver na fila, o indicador do terminal mostra a posição atual da varredura priorizada e quantas varreduras estão à frente.
- Varreduras publicadas exigem propriedade ou acesso de gerenciamento de publicador. Moderadores/administradores podem usar o mesmo backend por meio de `clawhub-admin`.
- `--update` é válido apenas com `--slug`; ele grava resultados de varredura publicados bem-sucedidos de volta na versão selecionada.
- `--output <file.zip>` baixa o arquivo completo do relatório com `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` e `README.md`.
- `--json` imprime a resposta completa de consulta para automação.
- Varreduras de caminho local não são mais compatíveis. Envie uma nova versão e depois use `scan download` para recuperar os resultados de varredura armazenados para essa versão enviada.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Exige `clawhub login`.
- Baixa o ZIP do relatório de varredura armazenado para uma versão enviada de Skill ou Plugin, incluindo versões que foram bloqueadas ou ocultadas por verificações de segurança do ClawHub.
- Downloads de Skill usam o slug da Skill e usam `--kind skill` por padrão.
- Downloads de Plugin usam o nome do pacote e exigem `--kind plugin`.
- `--version` é obrigatório para que autores inspecionem a versão enviada exata que o ClawHub bloqueou.
- `--output <file.zip>` escolhe o caminho de destino.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

O ClawHub fornece um workflow reutilizável oficial em
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/skill-publish.yml)
para repositórios de Skills e repositórios de catálogo.

Configuração típica de catálogo:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Observações:

- `root` usa `skills` como padrão para repositórios de catálogo.
- Passe `skill_path: skills/review-helper` para processar uma pasta de Skill.
- `owner` mapeia para a flag `--owner` da CLI; omita para publicar como o usuário autenticado.
- A publicação de Skills V1 usa `clawhub_token`; a publicação confiável por GitHub OIDC é apenas para pacotes por enquanto.

### `delete <skill>`

- Sem `--version`, exclui uma skill de forma reversível (proprietário, moderador ou admin).
- Chama `DELETE /api/v1/skills/{slug}`.
- Exclusões reversíveis iniciadas pelo proprietário reservam o slug por 30 dias; o comando imprime o horário de expiração.
- `--version <version>` exclui permanentemente uma versão possuída que não é a mais recente por meio de uma rota fail-closed,
  específica da versão.
  Versões excluídas não podem ser restauradas nem republicadas. Publique uma substituição antes de excluir a
  versão mais recente atual. A equipe da plataforma não ignora a propriedade neste fluxo somente de versão.
- `--reason <text>` registra uma nota de moderação em uma exclusão reversível da skill inteira e no log de auditoria.
- `--note <text>` é um alias de `--reason`.
- `--yes` pula a confirmação.

### `undelete <skill>`

- Restaura uma skill oculta (proprietário, moderador ou admin).
- Não há undelete de versão; versões excluídas permanentemente não podem ser restauradas.
- Chama `POST /api/v1/skills/{slug}/undelete`.
- `--reason <text>` registra uma nota de moderação na skill e no log de auditoria.
- `--note <text>` é um alias de `--reason`.
- `--yes` pula a confirmação.

### `hide <skill>`

- Oculta uma skill (proprietário, moderador ou admin).
- Alias de `delete`.

### `unhide <skill>`

- Reexibe uma skill (proprietário, moderador ou admin).
- Alias de `undelete`.

### `skill rename <skill> <new-name>`

- Renomeia uma skill possuída e mantém o slug anterior como alias de redirecionamento.
- Chama `POST /api/v1/skills/{slug}/rename`.
- `--yes` pula a confirmação.

### `skill merge <source> <target>`

- Mescla uma skill possuída em outra skill possuída.
- O slug de origem deixa de ser listado publicamente e se torna um alias de redirecionamento para o destino.
- Chama `POST /api/v1/skills/{sourceSlug}/merge`.
- `--yes` pula a confirmação.

### `transfer`

- Fluxo de transferência de propriedade.
- Transferências para handles de usuários criam uma solicitação pendente que o destinatário aceita.
- Transferências para handles de orgs/publicadores são aplicadas imediatamente somente quando o ator tem
  acesso de admin tanto ao proprietário atual quanto ao publicador de destino.
- Subcomandos:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpoints:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Navega ou pesquisa no catálogo unificado de pacotes via `GET /api/v1/packages` e `GET /api/v1/packages/search`.
- Use isto para plugins e outras entradas de famílias de pacotes; `search` de nível superior continua sendo a superfície de busca de skills.
- Flags:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, padrão: 25)
  - `--json`

Exemplos:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Busca metadados do pacote sem instalar.
- Use isto para metadados de Plugin, compatibilidade, verificação, origem e inspeção de versões/arquivos.
- `--version <version>`: inspeciona uma versão específica (padrão: mais recente).
- `--tag <tag>`: inspeciona uma versão marcada (por exemplo, `latest`).
- `--versions`: lista o histórico de versões (primeira página).
- `--limit <n>`: máximo de versões a listar (1-100).
- `--files`: lista arquivos da versão selecionada.
- `--file <path>`: busca o conteúdo bruto do arquivo (somente arquivos de texto; limite de 200 KB).
- `--json`: saída legível por máquina.

### `package download <name>`

- Resolve uma versão de pacote por meio de
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- Baixa o artefato a partir do `downloadUrl` do resolvedor.
- Verifica o SHA-256 do ClawHub para todos os artefatos.
- Para artefatos ClawPack npm-pack, também verifica a integridade npm `sha512`,
  o shasum npm e o nome/versão do `package.json` do tarball.
- Versões ZIP legadas são baixadas pela rota ZIP legada.
- Flags:
  - `--version <version>`: baixa uma versão específica.
  - `--tag <tag>`: baixa uma versão marcada (padrão: `latest`).
  - `-o, --output <path>`: arquivo ou diretório de saída.
  - `--force`: sobrescreve um arquivo de saída existente.
  - `--json`: saída legível por máquina.

Exemplos:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Calcula o SHA-256 do ClawHub, a integridade npm `sha512` e o shasum npm de um artefato
  local.
- Com `--package`, resolve os metadados esperados do ClawHub e compara o
  arquivo local com os metadados do artefato publicado.
- Com flags diretas de digest, verifica sem uma consulta de rede.
- Flags:
  - `--package <name>`: nome do pacote para resolver os metadados esperados do artefato.
  - `--version <version>` ou `--tag <tag>`: versão esperada do pacote.
  - `--sha256 <hex>`: SHA-256 esperado do ClawHub.
  - `--npm-integrity <sri>`: integridade npm esperada.
  - `--npm-shasum <sha1>`: shasum npm esperado.
  - `--json`: saída legível por máquina.

Exemplos:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Executa o Plugin Inspector embutido da CLI ClawHub contra uma pasta de pacote de Plugin
  local.
- O padrão é validação offline/estática, sem localizar nem importar um checkout local do
  OpenClaw.
- Erros graves de compatibilidade saem com código diferente de zero. Achados somente de aviso são impressos, mas
  saem com zero.
- Flags:
  - `--out <dir>`: grava relatórios do Plugin Inspector neste diretório.
  - `--openclaw <path>`: inspeciona contra um checkout local explícito do OpenClaw.
  - `--runtime`: habilita captura de runtime; importa código do Plugin.
  - `--allow-execute`: permite captura de runtime em um workspace isolado.
  - `--no-mock-sdk`: desabilita o SDK do OpenClaw simulado durante a captura de runtime.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package validate ./example-plugin
```

Se a validação relatar um achado de pacote, manifesto, importação do SDK ou artefato, consulte
[Correções de validação de Plugin](/clawhub/plugin-validation-fixes) e execute o comando novamente.

### `package delete <name>`

- Sem `--version`, exclui de forma reversível um pacote e todas as versões.
- `--version <version>` exclui permanentemente uma versão possuída que não é a mais recente por meio de uma rota fail-closed,
  específica da versão.
  Versões excluídas não podem ser restauradas nem republicadas. Publique uma substituição antes de excluir a
  versão mais recente atual. Este fluxo somente de versão exige o proprietário do pacote ou um admin do publicador da org; a equipe da plataforma não ignora a propriedade do pacote.
- A exclusão reversível do pacote inteiro exige o proprietário do pacote, um proprietário/admin do publicador da org, moderador
  da plataforma ou admin da plataforma.
- Flags:
  - `--version <version>`: exclui permanentemente uma versão que não é a mais recente.
  - `--yes`: pula a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Restaura um pacote e versões excluídos de forma reversível.
- Não há undelete de versão; versões excluídas permanentemente não podem ser restauradas.
- Exige o proprietário do pacote, um proprietário/admin do publicador da org, moderador da plataforma,
  ou admin da plataforma.
- Chama `POST /api/v1/packages/{name}/undelete`.
- Flags:
  - `--yes`: pula a confirmação.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Transfere um pacote para outro publicador.
- Exige acesso de admin tanto ao proprietário atual do pacote quanto ao publicador de destino,
  a menos que seja feito por um admin da plataforma.
- Nomes de pacotes com escopo devem ser transferidos para o proprietário do escopo correspondente.
- Chama `POST /api/v1/packages/{name}/transfer`.
- Flags:
  - `--to <owner>`: handle do publicador de destino.
  - `--reason <text>`: motivo opcional de auditoria.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Comando autenticado para denunciar um pacote aos moderadores.
- Chama `POST /api/v1/packages/{name}/report`.
- Denúncias são em nível de pacote, opcionalmente vinculadas a uma versão, e ficam visíveis
  para os moderadores analisarem.
- Denúncias não ocultam pacotes automaticamente nem bloqueiam downloads por si só.
- Flags:
  - `--version <version>`: versão opcional do pacote a anexar à denúncia.
  - `--reason <text>`: motivo obrigatório da denúncia.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Comando do proprietário para verificar a visibilidade de moderação do pacote.
- Chama `GET /api/v1/packages/{name}/moderation`.
- Mostra o estado atual de varredura do pacote, contagem de denúncias abertas, estado de moderação manual
  da versão mais recente, estado de bloqueio de download e motivos de moderação.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Verifica se um pacote está pronto para consumo futuro pelo OpenClaw.
- Chama `GET /api/v1/packages/{name}/readiness`.
- Relata bloqueadores para status oficial, disponibilidade do ClawPack, digest do artefato,
  proveniência da origem, compatibilidade com OpenClaw, destinos de host, metadados de ambiente
  e estado da varredura.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Mostra o status de migração orientado ao operador para um pacote que pode substituir um
  Plugin do OpenClaw embutido.
- Chama o mesmo endpoint de prontidão calculada que `package readiness`, mas imprime
  status focado em migração, versão mais recente, estado de pacote oficial, verificações e
  bloqueadores.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Cria um publicador de org pertencente ao usuário autenticado.
- O handle é normalizado para minúsculas e pode ser passado com ou sem `@`.
- Publicadores de org recém-criados não são confiáveis/oficiais por padrão.
- Falha se o handle já estiver sendo usado por um publicador, usuário ou rota reservada existente.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Publica um Plugin de código ou Plugin de pacote via `POST /api/v1/packages`.
- `<source>` aceita:
  - Caminho de pasta local: `./my-plugin`
  - Tarball local ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - Repositório do GitHub: `owner/repo` ou `owner/repo@ref`
  - URL do GitHub: `https://github.com/owner/repo`
- Os metadados são detectados automaticamente a partir de `package.json`, `openclaw.plugin.json` e
  marcadores reais de pacote OpenClaw, como `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` e `.cursor-plugin/plugin.json`.
- Fontes `.tgz` são tratadas como ClawPack. A CLI carrega exatamente os bytes
  do npm-pack e usa o conteúdo extraído de `package/` apenas para validação e
  pré-preenchimento de metadados.
- Pastas de Plugin de código são empacotadas em um tarball npm ClawPack antes do envio para que
  as instalações do OpenClaw possam verificar o artefato exato. Pastas de Plugin de pacote ainda
  usam o caminho de publicação por arquivos extraídos.
- Para fontes do GitHub, a atribuição de origem é preenchida automaticamente a partir do repositório, commit resolvido, ref e subcaminho.
- Para pastas locais, a atribuição de origem é detectada automaticamente a partir do git local quando o remote de origem aponta para o GitHub.
- Plugins de código externos devem declarar `openclaw.compat.pluginApi` e
  `openclaw.build.openclawVersion` explicitamente.
  `package.json.version` de nível superior não é usado como fallback para validação de publicação.
- `--dry-run` pré-visualiza a carga útil de publicação resolvida sem fazer upload.
- `--json` emite saída legível por máquina para CI.
- `--owner <handle>` publica sob um identificador de publicador de usuário ou organização quando o ator tem acesso de publicador.
- Nomes de pacotes com escopo devem corresponder ao owner selecionado. Consulte `docs/publishing.md`.
- As flags existentes (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) continuam funcionando como substituições.
- Repositórios privados do GitHub exigem `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Fluxo local recomendado

Use `--dry-run` primeiro para confirmar os metadados do pacote resolvidos e a
atribuição de origem antes de criar uma release ativa:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Fluxo de pasta local

Para Plugins de código, a publicação por pasta cria e carrega um artefato ClawPack a partir da
pasta do pacote:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` mínimo para `--family code-plugin`

Plugins de código externos precisam de uma pequena quantidade de metadados do OpenClaw em
`package.json`. Este manifesto mínimo é suficiente para uma publicação bem-sucedida:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Campos obrigatórios:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Observações:

- `package.json.version` é a versão da release do seu pacote, mas não é usado como
  fallback para validação de compatibilidade/build do OpenClaw.
- `openclaw.hostTargets` e `openclaw.environment` são metadados opcionais.
  O ClawHub pode exibi-los quando presentes, mas eles não são obrigatórios para publicação.
- `openclaw.compat.minGatewayVersion` e
  `openclaw.build.pluginSdkVersion` são extras opcionais se você quiser publicar
  metadados de compatibilidade mais detalhados.
- Se você estiver usando uma release mais antiga da CLI `clawhub`, atualize antes de publicar para que
  as verificações de preflight locais sejam executadas antes do upload.
- Se a validação relatar um código de correção, consulte
  [Correções de validação de Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

O ClawHub também distribui um workflow reutilizável oficial em
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/package-publish.yml)
para repositórios de Plugins.

Configuração típica do chamador:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Observações:

- O workflow reutilizável define `source` por padrão como o repositório chamador.
- Para monorepos, passe `source_path` para que o workflow publique a pasta do pacote do Plugin,
  por exemplo `source_path: extensions/codex`.
- Fixe o workflow reutilizável em uma tag estável ou SHA de commit completo. Não execute publicação de release a partir de `@main`.
- `pull_request` deve usar `dry_run: true` para que a CI não gere efeitos colaterais.
- Publicações reais devem ser limitadas a eventos confiáveis, como `workflow_dispatch` ou pushes de tag.
- Publicação confiável sem segredo funciona apenas em `workflow_dispatch`; pushes de tag ainda precisam de `clawhub_token`.
- Mantenha `clawhub_token` disponível para a primeira publicação, pacotes não confiáveis ou publicações emergenciais.
- O workflow carrega o resultado JSON como artefato e o expõe como saídas do workflow.

### `package trusted-publisher get <name>`

- Mostra a configuração de publicador confiável do GitHub Actions para um pacote.
- Use isto após definir a configuração para confirmar o repositório, o nome do arquivo de workflow
  e o pin opcional de ambiente.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Anexa ou substitui a configuração de publicador confiável do GitHub Actions para um
  pacote existente.
- O pacote deve ser criado primeiro por meio do fluxo normal manual ou autenticado por token
  `clawhub package publish`.
- Depois que a configuração for definida, publicações futuras compatíveis via GitHub Actions poderão usar
  OIDC/publicação confiável sem um token ClawHub de longa duração.
- `--repository <repo>` deve ser `owner/repo`.
- `--workflow-filename <file>` deve corresponder ao nome do arquivo de workflow em
  `.github/workflows/`.
- `--environment <name>` é opcional. Quando configurado, o ambiente do GitHub Actions
  na declaração OIDC deve corresponder exatamente.
- O ClawHub verifica o repositório GitHub configurado quando este comando é executado.
  Repositórios públicos podem ser verificados por meio de metadados públicos do GitHub. Repositórios privados
  exigem que o ClawHub tenha acesso do GitHub a esse repositório, por
  exemplo, por meio de uma futura instalação do GitHub App do ClawHub ou outra integração autorizada
  do GitHub.
- Flags:
  - `--repository <repo>`: repositório GitHub, por exemplo `openclaw/example-plugin`.
  - `--workflow-filename <file>`: nome do arquivo de workflow, por exemplo `package-publish.yml`.
  - `--environment <name>`: ambiente do GitHub Actions opcional com correspondência exata.
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Remove a configuração de publicador confiável de um pacote.
- Use isto como rollback se o workflow, o repositório ou o pin de ambiente precisar ser
  desativado ou recriado.
- Publicações reais futuras devem usar publicação autenticada normal até que a configuração seja
  definida novamente.
- Flags:
  - `--json`: saída legível por máquina.

Exemplo:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Telemetria de instalação

- Enviada após `clawhub install <slug>` quando conectado, a menos que
  `CLAWHUB_DISABLE_TELEMETRY=1` esteja definido.
- O relatório é feito em modo de melhor esforço. Comandos de instalação não falham se a telemetria estiver
  indisponível.
- Detalhes: `docs/telemetry.md`.
