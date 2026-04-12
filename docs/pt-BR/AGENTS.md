---
x-i18n:
    generated_at: "2026-04-12T23:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# Guia de Documentação

Este diretório é responsável pela criação de documentação, pelas regras de links do Mintlify e pela política de i18n da documentação.

## Regras do Mintlify

- A documentação é hospedada no Mintlify (`https://docs.openclaw.ai`).
- Links internos da documentação em `docs/**/*.md` devem permanecer com caminho relativo à raiz, sem sufixo `.md` ou `.mdx` (exemplo: `[Config](/configuration)`).
- Referências cruzadas de seções devem usar âncoras em caminhos relativos à raiz (exemplo: `[Hooks](/configuration#hooks)`).
- Títulos da documentação devem evitar travessões e apóstrofos porque a geração de âncoras do Mintlify é frágil nesses casos.
- README e outros documentos renderizados no GitHub devem manter URLs absolutas da documentação para que os links funcionem fora do Mintlify.
- O conteúdo da documentação deve permanecer genérico: sem nomes pessoais de dispositivos, nomes de host ou caminhos locais; use placeholders como `user@gateway-host`.

## Regras de Conteúdo da Documentação

- Na documentação, no texto da interface e nas listas de seleção, ordene serviços/provedores alfabeticamente, a menos que a seção esteja descrevendo explicitamente a ordem de execução ou de autodetecção.
- Mantenha a nomenclatura de Plugin empacotado consistente com as regras de terminologia de plugin definidas no `AGENTS.md` da raiz do repositório.

## i18n da Documentação

- Documentação em outros idiomas não é mantida neste repositório. A saída publicada gerada fica no repositório separado `openclaw/docs` (muitas vezes clonado localmente como `../openclaw-docs`).
- Não adicione nem edite documentação localizada em `docs/<locale>/**` aqui.
- Trate a documentação em inglês neste repositório, junto com os arquivos de glossário, como a fonte da verdade.
- Pipeline: atualize a documentação em inglês aqui, atualize `docs/.i18n/glossary.<locale>.json` conforme necessário e, em seguida, deixe a sincronização do repositório de publicação e `scripts/docs-i18n` rodarem em `openclaw/docs`.
- Antes de executar novamente `scripts/docs-i18n`, adicione entradas ao glossário para quaisquer novos termos técnicos, títulos de páginas ou rótulos curtos de navegação que precisem permanecer em inglês ou usar uma tradução fixa.
- `pnpm docs:check-i18n-glossary` é a verificação para títulos alterados da documentação em inglês e rótulos internos curtos da documentação.
- A memória de tradução fica nos arquivos gerados `docs/.i18n/*.tm.jsonl` no repositório de publicação.
- Consulte `docs/.i18n/README.md`.
