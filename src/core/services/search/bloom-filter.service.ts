import { Product } from '@app/database/entities/product.entity';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BloomFilter } from 'bloom-filters';
import { Repository } from 'typeorm';

@Injectable()
export class BloomFilterService implements OnModuleInit {
    private productNameFilter: BloomFilter;
    private productCategoryFilter: BloomFilter;

    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) {
        // Initialize Bloom filters with appropriate size and false positive rate
        // For demonstration, we're using small values. In production, tune these parameters
        // based on your expected data volume
        this.productNameFilter = new BloomFilter(10000, 5); // For ~1000 items with 0.01 false positive probability
        this.productCategoryFilter = new BloomFilter(1000, 5); // For ~100 categories
    }

    async onModuleInit() {
        // Populate Bloom filters on application startup
        await this.populateFilters();
    }

    async populateFilters() {
        const products = await this.productRepository.find();

        // Add all product names to the name filter
        products.forEach(product => {
            this.productNameFilter.add(product.name.toLowerCase());
        });

        // Add all categories to the category filter
        // We use a Set to get unique categories first
        const categories = new Set(products.map(product => product.category.toLowerCase()));
        categories.forEach(category => {
            this.productCategoryFilter.add(category);
        });

        console.log('Bloom filters populated successfully');
    }

    // Check if a product name might exist
    mightContainName(name: string): boolean {
        return this.productNameFilter.has(name.toLowerCase());
    }

    // Check if a category might exist
    mightContainCategory(category: string): boolean {
        return this.productCategoryFilter.has(category.toLowerCase());
    }

    // Update filters when new products are added
    addProduct(product: Product): void {
        this.productNameFilter.add(product.name.toLowerCase());
        this.productCategoryFilter.add(product.category.toLowerCase());
    }
}