import React, { useState, useEffect } from 'react';
import { useAlmacenAutenticacion } from './estado/almacenAutenticacion';
import { clienteApi } from './servicios/clienteApi';
import { SucursalResumen } from './tipos/modelos';
import { BarraLateral } from './componentes/BarraLateral';
import { BarraSuperior } from './componentes/BarraSuperior';
import { PantallaLogin } from './features/autenticacion/PantallaLogin';
import { PanelSuperAdmin } from './features/superadmin/PanelSuperAdmin';
import { MapaMesasSalon } from './features/pos/MapaMesasSalon';
import { PantallaCocina } from './features/kds/PantallaCocina';
import { GestionCajaFacturacion } from './features/caja/GestionCajaFacturacion';
import { GestionSucursales } from './features/sucursales/GestionSucursales';
import { GestionUsuarios } from './features/usuarios/GestionUsuarios';
import { ControlInventarioYRecetas } from './features/inventario/ControlInventarioYRecetas';

export const App: React.FC = () => {
  const { usuario, establecerSucursales, sucursalActivaId, establecerSucursalActiva } = useAlmacenAutenticacion();
  const [seccionActiva, setSeccionActiva] = useState<string>('pos');

  // Ajustar sección por defecto según el rol del usuario autenticado
  useEffect(() => {
    if (usuario) {
      if (usuario.rol === 'SuperAdmin') {
        setSeccionActiva('superadmin');
      } else if (usuario.rol === 'Cocinero') {
        setSeccionActiva('kds');
      } else if (usuario.rol === 'Cajero') {
        setSeccionActiva('caja');
      } else {
        setSeccionActiva('pos');
      }

      // Si es usuario de restaurante, cargar las sucursales
      if (usuario.rol !== 'SuperAdmin') {
        cargarSucursales();
      }
    }
  }, [usuario]);

  const cargarSucursales = async () => {
    try {
      const res = await clienteApi.get<SucursalResumen[]>('/sucursales');
      establecerSucursales(res.data);
      if (!sucursalActivaId && res.data.length > 0) {
        establecerSucursalActiva(res.data[0].id);
      }
    } catch (err) {
      console.error('Error al precargar sucursales:', err);
    }
  };

  if (!usuario) {
    return <PantallaLogin />;
  }

  const obtenerInfoSeccion = () => {
    switch (seccionActiva) {
      case 'superadmin':
        return { titulo: 'Plataforma Super Administrador SaaS', subtitulo: 'Control global de clientes arrendatarios y facturación' };
      case 'pos':
        return { titulo: 'Salón y Mapa de Mesas', subtitulo: 'Gestión gráfica de zonas, comensales y apertura de comandas' };
      case 'kds':
        return { titulo: 'Pantalla de Cocina (KDS)', subtitulo: 'Tickets en tiempo real y despacho de preparaciones' };
      case 'caja':
        return { titulo: 'Caja y Facturación Electrónica', subtitulo: 'Arqueo de turnos Z/X y emisión de comprobantes SUNAT UBL 2.1' };
      case 'sucursales':
        return { titulo: 'Sedes y Locales Comerciales', subtitulo: 'Administración multi-sucursal de tu negocio gastronómico' };
      case 'usuarios':
        return { titulo: 'Personal y Trazabilidad de Ventas', subtitulo: 'Gestión de trabajadores por sucursal y reporte de recaudación' };
      case 'inventario':
        return { titulo: 'Inventario, Recetas y Food Cost', subtitulo: 'Control de kardex de insumos y escandallo de platos' };
      default:
        return { titulo: 'Panel de Control', subtitulo: 'Sistema POS Gastronómico' };
    }
  };

  const info = obtenerInfoSeccion();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Barra Lateral de Navegación */}
      <BarraLateral
        seccionActiva={seccionActiva}
        alSeleccionarSeccion={setSeccionActiva}
      />

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra Superior con Contexto de Sede y Estado */}
        <BarraSuperior
          titulo={info.titulo}
          subtitulo={info.subtitulo}
        />

        {/* Vista Dinámica de la Sección Seleccionada */}
        <main className="flex-1 overflow-y-auto">
          {seccionActiva === 'superadmin' && <PanelSuperAdmin />}
          {seccionActiva === 'pos' && <MapaMesasSalon />}
          {seccionActiva === 'kds' && <PantallaCocina />}
          {seccionActiva === 'caja' && <GestionCajaFacturacion />}
          {seccionActiva === 'sucursales' && <GestionSucursales />}
          {seccionActiva === 'usuarios' && <GestionUsuarios />}
          {seccionActiva === 'inventario' && <ControlInventarioYRecetas />}
        </main>
      </div>
    </div>
  );
};
