import React from "react";
import { Carousel } from "primereact/carousel";
import ProductCard from "./ProductCard";
import { Button } from "primereact/button";

const ProductSection = ({ id, title, products, onViewAll }) => {
  const productTemplate = (p) => (
    <div className="p-2">
      <ProductCard
        key={p._id}
        id={p._id}
        brand={p.brand}
        name={p.name}
        price={p.price}
        rating={p.averageRating}
        img={p.images?.[0] || "/no-img.png"}
      />
    </div>
  );

  return (
    <div id={id} className="mb-8 pt-5">
      <div className="flex justify-content-between align-items-end mb-4">
        <h2 className="m-0 text-2xl font-medium uppercase tracking-wider">{title}</h2>
        <Button
            label="View All"
            className="p-button-text p-0 text-black font-bold uppercase text-xs border-bottom-1 border-black border-noround"
            onClick={onViewAll}
        />
      </div>

      <Carousel
        value={products}
        numVisible={4}
        numScroll={1}
        responsiveOptions={[
          { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
          { breakpoint: '767px', numVisible: 2, numScroll: 1 },
          { breakpoint: '575px', numVisible: 1, numScroll: 1 }
        ]}
        itemTemplate={productTemplate}
        circular
        showIndicators={false}
        showNavigators
      />
    </div>
  );
};

export default ProductSection;
