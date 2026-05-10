---
read_when:
    - Testando fluxos de integração inicial ou configuração com um Plugin empacotado localmente
    - Verificando um pacote de Plugin antes de publicá-lo
    - Substituindo uma instalação automática de Plugin por um artefato de teste
sidebarTitle: Install overrides
summary: Teste substituições de Plugin empacotadas com fluxos de instalação em tempo de configuração
title: Substituições de instalação de Plugin
x-i18n:
    generated_at: "2026-05-10T19:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

As substituições de instalação de Plugin permitem que mantenedores testem instalações de Plugin em tempo de configuração usando
um pacote npm específico ou um tarball local gerado com npm-pack. Elas são apenas para E2E e validação de pacote. Usuários normais devem instalar plugins com
[`openclaw plugins install`](/pt-BR/cli/plugins).

<Warning>
As substituições executam código de Plugin a partir da origem que você fornece. Use-as somente em um
diretório de estado isolado ou em uma máquina de teste descartável.
</Warning>

## Ambiente

As substituições ficam desativadas a menos que ambas as variáveis sejam definidas:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

O mapa de substituições é JSON indexado por id de Plugin. Os valores aceitam:

- `npm:<registry-spec>` para pacotes de registro e versões ou tags exatas
- `npm-pack:<path.tgz>` para tarballs locais produzidos por `npm pack`

Caminhos `npm-pack:` relativos são resolvidos a partir do diretório de trabalho atual.

## Comportamento

Quando um fluxo em tempo de configuração solicita a instalação de um Plugin cujo id aparece no mapa,
o OpenClaw usa a origem de substituição em vez da origem npm do catálogo, empacotada ou padrão. Isso se aplica ao onboarding e a outros fluxos que usam o instalador de Plugin compartilhado em tempo de configuração.

As substituições ainda impõem o id de Plugin esperado. Um tarball mapeado para `codex`
deve instalar um Plugin cujo id de manifesto seja `codex`.

As substituições não herdam o status oficial de origem confiável. Mesmo quando a entrada do catálogo normalmente representa um pacote de propriedade do OpenClaw, uma substituição é tratada como entrada de teste fornecida pelo operador.

Arquivos `.env` do workspace não podem habilitar substituições de instalação. Defina essas variáveis no shell confiável, job de CI ou comando de teste remoto que inicia o OpenClaw.

## E2E de pacote

Use um diretório de estado isolado para que instalações de pacote e registros de instalação não
toquem seu estado normal do OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifique o pacote instalado sob o diretório de estado:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

Para E2E com provedor ao vivo, carregue a chave real de API a partir de um shell confiável ou segredo de CI
antes de iniciar o comando de teste. Não imprima chaves; reporte apenas a origem e
se a chave estava presente.
