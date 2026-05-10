---
read_when:
    - Você quer um arquivo de backup de primeira classe para o estado local do OpenClaw
    - Você quer visualizar quais caminhos seriam incluídos antes de redefinir ou desinstalar
summary: Referência da CLI para `openclaw backup` (criar arquivos de backup locais)
title: Cópia de segurança
x-i18n:
    generated_at: "2026-05-10T19:27:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Crie um arquivo de backup local para o estado, a configuração, os perfis de autenticação, as credenciais de canais/provedores, as sessões e, opcionalmente, os workspaces do OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Observações

- O arquivo inclui um arquivo `manifest.json` com os caminhos de origem resolvidos e o layout do arquivo.
- A saída padrão é um arquivo `.tar.gz` com timestamp no diretório de trabalho atual.
- Se o diretório de trabalho atual estiver dentro de uma árvore de origem incluída no backup, o OpenClaw usa seu diretório inicial como fallback para o local padrão do arquivo.
- Arquivos existentes nunca são sobrescritos.
- Caminhos de saída dentro das árvores de estado/workspace de origem são rejeitados para evitar autoinclusão.
- `openclaw backup verify <archive>` valida que o arquivo contém exatamente um manifesto raiz, rejeita caminhos de arquivo em estilo de travessia e verifica se todo payload declarado no manifesto existe no tarball.
- `openclaw backup create --verify` executa essa validação imediatamente após gravar o arquivo.
- `openclaw backup create --only-config` faz backup apenas do arquivo de configuração JSON ativo.

## O que é incluído no backup

`openclaw backup create` planeja as origens de backup a partir da sua instalação local do OpenClaw:

- O diretório de estado retornado pelo resolvedor de estado local do OpenClaw, geralmente `~/.openclaw`
- O caminho do arquivo de configuração ativo
- O diretório `credentials/` resolvido quando ele existe fora do diretório de estado
- Diretórios de workspace descobertos a partir da configuração atual, a menos que você passe `--no-include-workspace`

Os perfis de autenticação de modelo já fazem parte do diretório de estado em
`agents/<agentId>/agent/auth-profiles.json`, portanto normalmente são cobertos pela
entrada de backup de estado.

Se você usar `--only-config`, o OpenClaw ignora a descoberta de estado, diretório de credenciais e workspaces, e arquiva apenas o caminho do arquivo de configuração ativo.

O OpenClaw canonicaliza os caminhos antes de criar o arquivo. Se a configuração, o
diretório de credenciais ou um workspace já estiverem dentro do diretório de estado,
eles não serão duplicados como origens de backup separadas de nível superior. Caminhos ausentes são
ignorados.

O payload do arquivo armazena o conteúdo dos arquivos dessas árvores de origem, e o `manifest.json` incorporado registra os caminhos absolutos de origem resolvidos, além do layout de arquivo usado para cada ativo.

Durante a criação do arquivo, o OpenClaw ignora arquivos conhecidos de mutação em tempo real que não têm valor de restauração, incluindo transcrições de sessões de agentes ativos, logs de execuções de Cron, logs rotativos, filas de entrega, arquivos de socket/pid/temp no diretório de estado e arquivos temporários relacionados de filas duráveis. O resultado JSON inclui `skippedVolatileCount` para que a automação possa ver quantos arquivos foram omitidos intencionalmente.

Os arquivos de origem e de manifesto de plugins instalados na árvore
`extensions/` do diretório de estado são incluídos, mas suas árvores de dependências
`node_modules/` aninhadas são ignoradas. Essas dependências são artefatos de instalação recriáveis; após
restaurar um arquivo, use `openclaw plugins update <id>` ou reinstale o plugin
com `openclaw plugins install <spec> --force` quando um plugin restaurado relatar
dependências ausentes.

## Comportamento com configuração inválida

`openclaw backup` ignora intencionalmente o preflight normal da configuração para que ainda possa ajudar durante a recuperação. Como a descoberta de workspaces depende de uma configuração válida, `openclaw backup create` agora falha rapidamente quando o arquivo de configuração existe, mas é inválido, e o backup de workspaces ainda está habilitado.

Se você ainda quiser um backup parcial nessa situação, execute novamente:

```bash
openclaw backup create --no-include-workspace
```

Isso mantém o estado, a configuração e o diretório de credenciais externo no escopo, enquanto
ignora completamente a descoberta de workspaces.

Se você precisa apenas de uma cópia do próprio arquivo de configuração, `--only-config` também funciona quando a configuração está malformada, porque não depende da análise da configuração para a descoberta de workspaces.

## Tamanho e desempenho

O OpenClaw não impõe um tamanho máximo de backup integrado nem limite de tamanho por arquivo.

Os limites práticos vêm da máquina local e do sistema de arquivos de destino:

- Espaço disponível para a gravação temporária do arquivo mais o arquivo final
- Tempo para percorrer grandes árvores de workspaces e compactá-las em um `.tar.gz`
- Tempo para reexaminar o arquivo se você usar `openclaw backup create --verify` ou executar `openclaw backup verify`
- Comportamento do sistema de arquivos no caminho de destino. O OpenClaw prefere uma etapa de publicação com hard link sem sobrescrita e recorre à cópia exclusiva quando hard links não são compatíveis

Workspaces grandes geralmente são o principal fator do tamanho do arquivo. Se você quiser um backup menor ou mais rápido, use `--no-include-workspace`.

Para o menor arquivo, use `--only-config`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
