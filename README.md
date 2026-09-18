# Documentação Técnica do Frontend da Solução VanBora

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## 1. Visão Geral da Arquitetura do Frontend, Design System e Experiência do Usuário

O ecossistema frontend do projeto Rota Estudantil foi arquitetado e desenvolvido utilizando React Native em conjunto com o ecossistema Expo e TypeScript, assegurando uma aplicação multiplataforma nativa de alta fluidez, desempenho otimizado e design limpo. A interface foi projetada estruturalmente para atender simultaneamente a dois perfis cruciais de usuários durante o ciclo operacional diário: o **Estudante/Responsável** e o **Motorista da Van**.

A arquitetura de navegação emprega abordagens modernas baseadas em rotas por arquivos, gerenciamento de estado reativo de alta performance e estratégias robustas de sincronização assíncrona para contornar instabilidades e variações de conectividade de rede nas ruas e rodovias.

## 2. Stack Tecnológica, Dependências e Ecossistema de Bibliotecas

* **Framework Mobile Principal:** React Native integrado com o Expo, utilizando ferramentas modernas de compilação e build nativo.
* **Linguagem de Programação:** TypeScript, garantindo tipagem estática rigorosa, contratos de dados seguros e prevenção de erros em tempo de compilação.
* **Estilização e Camada Visual:** Estilização nativa otimizada por componentes modulares (StyleSheet do React Native), assegurando renderização acelerada e consistência de design em diferentes densidades de tela de dispositivos móveis.
* **Gerenciamento de Estado e Persistência Local:** Utilização avançada de React Hooks nativos (`useState`, `useEffect`, `useContext`) combinados com o AsyncStorage para garantir a persistência segura de tokens de sessão, preferências de usuário e cache off-line temporário.
* **Comunicação HTTP Assíncrona:** Cliente Axios configurado para requisições RESTful, gerenciamento de interceptadores e tratamento centralizado de falhas de comunicação com o backend Spring Boot.

## 3. Estrutura de Componentes, Ciclo de Vida e Fluxos Operacionais (Destaque: Home.tsx)

* **Estado de Presença Reativo e Persistido:** O estado de presença do aluno é gerenciado dinamicamente por meio de `useState` e persistido localmente via AsyncStorage, garantindo que a preferência de transporte selecionada permaneça intacta mesmo após reinicializações do aplicativo.
* **Atualização Otimista da Interface (Optimistic UI):** A interface responde instantaneamente à interação de toque do usuário. O sistema emprega um atraso de segurança controlado (`setTimeout`) antes da sincronização total com o servidor backend, eliminando travamentos visuais e mitigando conflitos de concorrência em redes móveis lentas.
* **Gestão de Decisão do Aluno e Feedback Visual para o Motorista:**
  * **Estudantes:** Possuem um painel intuitivo com 4 opções flexíveis de status operacional (`IDA`, `VOLTA`, `AMBOS`, `NAO_VOU`).
  * **Motoristas:** Recebem feedback visual imediato e em tempo real sobre a totalidade das respostas consolidadas da turma, permitindo avaliar a prontidão da van antes de iniciar o trajeto.

## 4. Mapeamento de Endpoints, Contratos de API e Fluxo de Comunicação

A aplicação consome diretamente os serviços expostos pela API REST do backend por meio de rotas estruturadas:

* **Gerenciamento e Confirmação de Presença (`POST /rota/confirmar`):** Envia e atualiza o status de presença do estudante. Suporta o envio do parâmetro especial `LIMPAR` para apagar registros e reiniciar o fluxo de "Aguardando Resposta" na tela do motorista.
* **Listagem Consolidada de Passageiros (`GET /usuarios/passageiros`):** Retorna a listagem de todos os usuários cadastrados com o perfil `PASSAGEIRO`, juntamente com seus respectivos estados de embarque para o dia operacional vigente.
* **Cadastro de Novos Usuários (`POST /usuarios/cadastrar`):** Endpoint responsável pelo registro seguro de novos perfis institucionais na base de dados relacional.
* **Autenticação e Sessão (`POST /usuarios/login`):** Executa o fluxo de autenticação baseado em credenciais de acesso para liberação de rotas protegidas no aplicativo.

## 5. Regras de Negócio, Validações no Cliente e Tratamento de Exceções

* **Bloqueio de Partida da Rota:** O motorista possui restrição lógica rigorosa que impede a liberação do início da rota caso o total de passageiros confirmados não atinja os parâmetros de validação exigidos pelo sistema.
* **Mitigação de Concorrência e Latência:** Mecanismos internos de atraso controlado ajustam a sincronização para lidar com oscilações de rede sem corromper o estado visual do usuário.

## 6. Pré-requisitos, Dependências de Sistema e Configuração de Ambiente

* **Pré-requisitos de Ambiente:** Node.js versão 18 ou superior instalado, em conjunto com a Expo CLI configurada no sistema operacional.
* **Configuração de Rede e Servidor:** Defina o endereço IP ativo do servidor backend no arquivo de configuração de rede (ex: `config.js`). Para testes externos em dispositivos físicos, utilize ferramentas de túnel local como `npx localtunnel --port 8080`.
* **Procedimento de Instalação e Execução:** 
  1. Execute `npm install` na raiz do projeto para baixar todas as dependências do `package.json`.
  2. Execute `npx expo start` para inicializar o empacotador Metro e abrir o ambiente de desenvolvimento.

### Visualizar o Repositório do Backend

https://github.com/pethersonzada/rota-estudantil-backend

## 🔒 Licença e Direitos Autorais

Copyright© 2026 Miguel Petherson Silva. Todos os direitos reservados.

Este software e sua documentação associada (o "Projeto Rota Estudantil") são de propriedade exclusiva do autor. 

É expressamente proibida a cópia, modificação, distribuição, comercialização ou utilização total ou parcial deste código-fonte sem a autorização prévia e expressa por escrito do autor.
