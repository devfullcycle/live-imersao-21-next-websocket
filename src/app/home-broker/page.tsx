"use client";

//Client Component - part server | part browser
//Server Component (100% do lado servidor) vs Client Component
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
} from "lightweight-charts";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import io from "socket.io-client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const socket = io("http://localhost:8080");
//dividir os componentes

//root
//pagina home broker
  //com - listagem assets
  //grafico

export default function HomeBrokerPage() {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const chartRef = useRef<IChartApi>(null);
  const lineSeriesRef = useRef<ISeriesApi<any>>(null);
  const { data: assetsFetched } = useSWR(
    "http://localhost:8080/assets",
    fetcher
  );
  const { data: ordersFetched } = useSWR(
    "http://localhost:8080/orders",
    fetcher
  );

  useEffect(() => {
    //@ts-expect-error - discard
    chartRef.current = createChart(
      document.querySelector("#asset-chart") as HTMLElement,
      {
        width: 0,
        height: 300,
      }
    );
  }, []);

  useEffect(() => {
    if (!selectedAsset) {
      return;
    }

    fetch(`http://localhost:8080/assets/${selectedAsset.id}/histories`)
      .then((res) => res.json())
      .then((data) => {
        if (!lineSeriesRef.current) {
          //@ts-expect-error - discard
          lineSeriesRef.current = chartRef.current!.addSeries(LineSeries);
        }
        lineSeriesRef.current!.setData(data);
      });
  }, [selectedAsset]);

  useEffect(() => {
    if (!assetsFetched) {
      return;
    }
    assetsFetched.forEach((asset) => {
      socket.on(`asset-${asset.id}-price`, (data) => {
        if (selectedAsset && selectedAsset.id === asset.id) {
          lineSeriesRef.current.update({
            time: new Date(data.time).getTime(),
            value: data.asset.price,
          });
        }

        document.querySelector(`#asset-${asset.id}`)!.innerHTML = `${asset.symbol} - R$ ${asset.price.toFixed(2)}`
      });
    });

    return () => {
      socket.offAny();
    };
  }, [selectedAsset, assetsFetched]);

  const onSubmit = useCallback(() => {

  }, []);


  return (
    <div className="h-screen flex bg-gray-100">
      <form onSubmit={onSubmit}></form>
      <aside className="w-1/4 bg-white p-4 shadow-md">
        <h2 className="text-lg font-bold mb-4">Ativos</h2>
        <ul className="space-y-2">
          {assetsFetched?.map((asset, key) => (
            <li
              key={key}
              id={`asset-${asset.id}`}
              className="p-2 bg-gray-200 rounded cursor-pointer"
              onClick={() => setSelectedAsset(asset)}
            >
              {asset.symbol} - R$ ${asset.price.toFixed(2)}
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 p-6">
        <div className="bg-white p-4 shadow-md rounded-lg mb-4">
          <div id="asset-chart"></div>
        </div>
        {/* <!-- Lista de Ordens --> */}
        <div className="bg-white p-4 shadow-md rounded-lg">
          <h2 className="text-lg font-bold mb-4">Ordens</h2>
          <ul className="space-y-2">
            {ordersFetched?.map((order: any) => (
              <li key={order.id} className="p-2 bg-gray-100">
                <div>
                  <span className="font-semibold pr-1">
                    {order.type.toUpperCase()}
                  </span>
                  <span className="text-blue-500 pr-1">{order.asset}</span>{" "}
                  |&nbsp;
                  <span>{order.quantity} units</span>
                </div>
                <div className="text-green-600 font-bold">
                  ${order.price.toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

//Virtual DOM

//DOM JavaScript

//eventos onClick, botão
//websocket
//api de geolocalização
//api de voz