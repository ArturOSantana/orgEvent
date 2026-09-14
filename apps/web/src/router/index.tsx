import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/LoginPage'
import { RegistroPage } from '../pages/RegistroPage'
import { EventosPage } from '../pages/EventosPage'
import { EventoDetailPage } from '../pages/EventoDetailPage'
import { EventoDashboardPage } from '../pages/EventoDashboardPage'
import { CronogramaPage } from '../pages/CronogramaPage'
import { EquipesPage } from '../pages/EquipesPage'
import { VoluntariosPage } from '../pages/VoluntariosPage'
import { ParticipantesPage } from '../pages/ParticipantesPage'
import { QuartosPage } from '../pages/QuartosPage'
import { MateriaisPage } from '../pages/MateriaisPage'
import { InscricoesPage } from '../pages/InscricoesPage'
import { FormularioEditorPage } from '../pages/FormularioEditorPage'
import { InscricaoPublicaPage } from '../pages/InscricaoPublicaPage'
import { NaoEncontradoPage } from '../pages/NaoEncontradoPage'
import { PerfilPage } from '../pages/PerfilPage'
import { ConvitePage } from '../pages/ConvitePage'

export const router = createBrowserRouter([
  // Rota pública de login
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Rota pública de registro
  {
    path: '/registro',
    element: <RegistroPage />,
  },

  // Rota pública de inscrição — sem AppShell, sem ProtectedRoute
  {
    path: '/inscricao/:slug',
    element: <InscricaoPublicaPage />,
  },

  // Rota pública de convite do voluntário — sem AppShell, sem ProtectedRoute
  {
    path: '/convite/:slug',
    element: <ConvitePage />,
  },

  // Redireciona raiz para /eventos
  {
    path: '/',
    element: <Navigate to="/eventos" replace />,
  },

  // Rotas protegidas com AppShell
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: '/eventos',
            element: <EventosPage />,
          },
          // Layout do evento — todas as sub-rotas renderizam dentro do Outlet
          {
            path: '/eventos/:eventoId',
            element: <EventoDetailPage />,
            children: [
              // Redireciona a rota base para visão geral
              {
                index: true,
                element: <Navigate to="visao-geral" replace />,
              },
              {
                path: 'visao-geral',
                element: <EventoDashboardPage />,
              },
              {
                path: 'cronograma',
                element: <CronogramaPage />,
              },
              {
                path: 'equipes',
                element: <EquipesPage />,
              },
              {
                path: 'voluntarios',
                element: <VoluntariosPage />,
              },
              {
                path: 'participantes',
                element: <ParticipantesPage />,
              },
              {
                path: 'quartos',
                element: <QuartosPage />,
              },
              {
                path: 'materiais',
                element: <MateriaisPage />,
              },
              {
                path: 'inscricoes',
                element: <InscricoesPage />,
              },
            ],
          },
          // Editor de formulário — fora do Outlet do EventoDetailPage
          {
            path: '/eventos/:eventoId/formulario',
            element: <FormularioEditorPage />,
          },
          {
            path: '/perfil',
            element: <PerfilPage />,
          },
        ],
      },
    ],
  },

  // 404
  {
    path: '*',
    element: <NaoEncontradoPage />,
  },
])
