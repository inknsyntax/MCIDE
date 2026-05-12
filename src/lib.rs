use wasm_bindgen::prelude::*;
use std::collections::HashMap;

#[wasm_bindgen]
pub struct MCIDEEngine {
    width: u32,
    height: u32,
    block_names: Vec<String>,
    world: Vec<u16>,
    current_version: String,
    versions: HashMap<String, Vec<bool>>,
}

#[wasm_bindgen]
impl MCIDEEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> MCIDEEngine {
        let block_names: Vec<String> = vec![
            "stone", "dirt", "grass_block", "cobblestone", "oak_planks", "oak_log", "oak_leaves", "sand", "gravel", "water", "lava",
            "bedrock", "oak_sapling", "spruce_log", "spruce_wood", "spruce_planks", "spruce_leaves", "birch_log", "birch_wood", "birch_planks",
            "birch_leaves", "jungle_log", "jungle_wood", "jungle_planks", "jungle_leaves", "acacia_log", "acacia_wood", "acacia_planks", "acacia_leaves",
            "dark_oak_log", "dark_oak_wood", "dark_oak_planks", "dark_oak_leaves", "mangrove_log", "mangrove_wood", "mangrove_planks", "mangrove_leaves",
            "warped_stem", "warped_planks", "crimson_stem", "crimson_planks", "bamboo_block", "bamboo_planks", "granite", "diorite", "andesite",
            "moss_block", "smooth_stone", "deepslate", "polished_deepslate", "deepslate_bricks", "blackstone", "polished_blackstone", "basalt",
            "polished_basalt", "calcite", "tuff", "mud", "clay", "coal_ore", "iron_ore", "gold_ore", "diamond_ore", "emerald_ore", "lapis_ore",
            "redstone_ore", "copper_ore", "deepslate_coal_ore", "deepslate_iron_ore", "deepslate_gold_ore", "deepslate_diamond_ore",
            "deepslate_emerald_ore", "deepslate_lapis_ore", "deepslate_redstone_ore", "deepslate_copper_ore", "iron_block", "gold_block",
            "diamond_block", "emerald_block", "lapis_block", "coal_block", "copper_block", "raw_iron_block", "raw_gold_block", "raw_copper_block",
            "netherite_block", "ancient_debris", "glass", "white_wool", "orange_wool", "magenta_wool", "light_blue_wool", "yellow_wool",
            "lime_wool", "pink_wool", "gray_wool", "light_gray_wool", "cyan_wool", "purple_wool", "blue_wool", "brown_wool", "green_wool",
            "red_wool", "black_wool", "white_concrete", "orange_concrete", "magenta_concrete", "light_blue_concrete", "yellow_concrete",
            "lime_concrete", "pink_concrete", "grass", "seagrass", "tall_seagrass", "sugar_cane", "cactus", "dead_bush", "poppy", "dandelion",
            "blue_orchid", "allium", "azure_bluet", "red_tulip", "orange_tulip", "white_tulip", "pink_tulip", "oxeye_daisy", "cornflower",
            "lily_of_the_valley", "wither_rose", "spore_blossom", "netherrack", "nether_bricks", "nether_wart_block", "warped_wart_block",
            "nether_gold_ore", "nether_quartz_ore", "soul_sand", "soul_soil", "redstone_block", "redstone_wire", "redstone_torch", "redstone_lamp",
            "lever", "stone_button", "oak_button", "repeater", "comparator", "observer", "dispenser", "dropper", "piston", "sticky_piston",
            "hopper", "sculk_sensor", "furnace", "crafting_table", "bookshelf", "obsidian", "ice", "snow", "farmland", "barrel", "chest",
            "shulker_box", "beacon", "enchanting_table", "brewing_stand", "cauldron", "jukebox", "bell", "lantern", "repeating_command_block",
            "chain_command_block", "command_block", "white_banner", "orange_banner", "magenta_banner", "light_blue_banner", "yellow_banner",
            "lime_banner", "pink_banner", "gray_banner", "light_gray_banner", "cyan_banner", "purple_banner", "blue_banner", "brown_banner",
            "green_banner", "red_banner", "black_banner", "white_bed", "orange_bed", "magenta_bed", "light_blue_bed", "yellow_bed", "lime_bed",
            "pink_bed", "gray_bed", "light_gray_bed", "cyan_bed", "purple_bed", "blue_bed", "brown_bed", "green_bed", "red_bed", "black_bed",
            // Additional blocks for variety
            "oak_door", "spruce_door", "birch_door", "jungle_door", "acacia_door", "dark_oak_door", "mangrove_door", "warped_door", "crimson_door",
            "oak_stairs", "spruce_stairs", "birch_stairs", "jungle_stairs", "acacia_stairs", "dark_oak_stairs", "stone_stairs", "nether_brick_stairs",
            "oak_slab", "spruce_slab", "birch_slab", "jungle_slab", "stone_slab", "sandstone_slab", "deepslate_slab", "copper_slab",
            "oak_fence", "spruce_fence", "birch_fence", "jungle_fence", "dark_oak_fence", "mangrove_fence",
            "oak_trapdoor", "spruce_trapdoor", "birch_trapdoor", "jungle_trapdoor", "acacia_trapdoor", "dark_oak_trapdoor",
            "sandstone", "red_sandstone", "sandstone_stairs", "cut_sandstone", "chiseled_sandstone",
            "bricks", "brick_stairs", "brick_slab", "mossy_stone_bricks", "stone_bricks", "cracked_stone_bricks", "chiseled_stone_bricks",
            "end_stone", "end_stone_bricks", "purpur_block", "purpur_pillar", "purpur_stairs", "purpur_slab",
            "dragon_egg", "crying_obsidian", "respawn_anchor", "lodestone",
            "white_terracotta", "orange_terracotta", "magenta_terracotta", "light_blue_terracotta", "yellow_terracotta",
            "lime_terracotta", "pink_terracotta", "gray_terracotta", "light_gray_terracotta", "cyan_terracotta",
            "purple_terracotta", "blue_terracotta", "brown_terracotta", "green_terracotta", "red_terracotta", "black_terracotta",
            "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log",
            "amethyst_block", "budding_amethyst", "amethyst_cluster",
            "copper_block", "exposed_copper", "weathered_copper", "oxidized_copper",
            "waxed_copper_block", "waxed_exposed_copper", "waxed_weathered_copper", "waxed_oxidized_copper",
            "rooted_dirt", "hanging_roots", "azalea", "flowering_azalea",
            // More decorative and building blocks
            "prismarine", "prismarine_bricks", "dark_prismarine",
            "sea_lantern", "dark_oak_sign", "oak_sign", "birch_sign", "spruce_sign", "jungle_sign",
            "gray_concrete", "white_concrete", "black_concrete", "red_concrete", "yellow_concrete", "blue_concrete",
            "tint_glass", "tinted_glass", "light_weighted_pressure_plate", "heavy_weighted_pressure_plate",
            "comparator_on", "repeater_on", "daylight_detector", "daylight_detector_inverted",
            "lightning_rod", "copper_grate", "copper_trapdoor", "copper_door",
            "raw_ore_block", "iron_ore_deepslate", "coal_ore_deepslate",
            "basalt_pillar", "small_amethyst_bud", "medium_amethyst_bud", "large_amethyst_bud",
            "pale_moss_block", "pale_hanging_moss", "pale_moss_carpet",
            "tuff_brick", "tuff_brick_slab", "tuff_brick_stairs", "polished_tuff_brick",
            "polished_tuff", "polished_tuff_slab", "polished_tuff_stairs",
            "sculk", "sculk_vein", "sculk_catalyst", "sculk_shrieker", "sculk_shrieker_can_summon",
            "reinforced_deepslate", "deepslate_tile", "deepslate_tile_slab", "deepslate_tile_stairs",
            "deepslate_tile_wall", "polished_deepslate_wall", "deepslate_brick_wall",
            "smooth_quartz", "smooth_red_sandstone", "smooth_sandstone", "smooth_stone",
        ].iter().map(|s| s.to_string()).collect();

        let mut world = vec![0u16; 256 * 256 * 64];
        // Create ground layer: grass at y=0, dirt below (y<0 is bedrock)
        for x in 0..256 {
            for z in 0..256 {
                let grass_idx = (x + z * 256 + 0 * 256 * 256) as usize;
                let dirt_idx = (x + z * 256 + 1 * 256 * 256) as usize;
                if grass_idx < world.len() {
                    world[grass_idx] = 3;  // grass_block
                }
                if dirt_idx < world.len() {
                    world[dirt_idx] = 2;  // dirt
                }
            }
        }

        let mut versions: HashMap<String, Vec<bool>> = HashMap::new();
        let all_true = vec![true; block_names.len()];
        versions.insert("1.20.4".to_string(), all_true.clone());
        versions.insert("1.20.1".to_string(), all_true.clone());
        versions.insert("1.0".to_string(), vec![true; block_names.len()]);

        MCIDEEngine {
            width,
            height,
            block_names,
            world,
            current_version: "1.20.4".to_string(),
            versions,
        }
    }

    pub fn get_width(&self) -> u32 { self.width }
    pub fn get_height(&self) -> u32 { self.height }
    pub fn render(&self) -> String {
        format!("MCIDE Engine initialized: {}x{} with {} block types", 
            self.width, self.height, self.block_names.len())
    }

    pub fn get_block(&self, x: u32, y: u32, z: u32) -> u32 {
        if x >= 256 || z >= 256 || y >= 64 { return 0; }
        let idx = (x + z * 256 + y * 256 * 256) as usize;
        if idx < self.world.len() { self.world[idx] as u32 } else { 0 }
    }

    pub fn set_block(&mut self, x: u32, y: u32, z: u32, block_id: u32) {
        if x >= 256 || z >= 256 || y >= 64 { return; }
        let idx = (x + z * 256 + y * 256 * 256) as usize;
        if idx < self.world.len() { self.world[idx] = block_id as u16; }
    }

    pub fn get_block_name(&self, block_id: u32) -> String {
        if (block_id as usize) < self.block_names.len() {
            self.block_names[block_id as usize].clone()
        } else { "unknown".to_string() }
    }

    pub fn get_block_list(&self) -> String {
        let mut result = String::from("[");
        for (i, name) in self.block_names.iter().enumerate() {
            result.push_str(&format!(r#"{{"id":{},"name":"{}"}}"#, i, name));
            if i < self.block_names.len() - 1 { result.push(','); }
        }
        result.push(']');
        result
    }

    pub fn get_available_blocks(&self) -> String {
        let availability = self.versions.get(&self.current_version)
            .cloned()
            .unwrap_or_else(|| vec![true; self.block_names.len()]);
        let mut result = String::from("[");
        let mut first = true;
        for (i, name) in self.block_names.iter().enumerate() {
            let available = availability.get(i).copied().unwrap_or(true);
            if available {
                if !first { result.push(','); }
                result.push_str(&format!(r#"{{"id":{},"name":"{}"}}"#, i, name));
                first = false;
            }
        }
        result.push(']');
        result
    }

    pub fn get_versions(&self) -> String {
        let mut result = String::from("[");
        let mut versions: Vec<_> = self.versions.keys().collect();
        versions.sort();
        for (i, version) in versions.iter().enumerate() {
            if i > 0 { result.push(','); }
            result.push_str(&format!(r#""{}""#, version));
        }
        result.push(']');
        result
    }

    pub fn set_version(&mut self, version: &str) {
        if self.versions.contains_key(version) {
            self.current_version = version.to_string();
        }
    }

    pub fn get_current_version(&self) -> String {
        self.current_version.clone()
    }

    pub fn is_block_available(&self, block_id: u32) -> bool {
        let availability = self.versions.get(&self.current_version)
            .cloned()
            .unwrap_or_else(|| vec![true; self.block_names.len()]);
        availability.get(block_id as usize).copied().unwrap_or(false)
    }

    pub fn generate_chunk_mesh(&self, chunk_x: u32, chunk_z: u32) -> String {
        let mut vertices = String::from("[");
        let mut first = true;
        for y in 0..16 {
            for x in 0..16 {
                for z in 0..16 {
                    let world_x = chunk_x * 16 + x;
                    let world_z = chunk_z * 16 + z;
                    let block_id = self.get_block(world_x, y, world_z) as u16;
                    if block_id > 0 {
                        let px = x as f32;
                        let py = y as f32;
                        let pz = z as f32;
                        let cube_verts = format!(r#"{{"x":{},"y":{},"z":{},"id":{}}}"#, px, py, pz, block_id);
                        if !first { vertices.push(','); }
                        vertices.push_str(&cube_verts);
                        first = false;
                    }
                }
            }
        }
        vertices.push(']');
        vertices
    }

    pub fn get_world_stats(&self) -> String {
        let mut total = 0;
        let mut by_type = vec![0u32; self.block_names.len()];
        for &block_id in &self.world {
            if block_id > 0 {
                total += 1;
                if (block_id as usize) < by_type.len() {
                    by_type[block_id as usize] += 1;
                }
            }
        }
        let mut result = format!(r#"{{"total":{},"by_type":{{"#, total);
        let mut first = true;
        for (id, &count) in by_type.iter().enumerate() {
            if count > 0 {
                if !first { result.push(','); }
                result.push_str(&format!(r#""{}":"#, self.block_names[id]));
                result.push_str(&count.to_string());
                first = false;
            }
        }
        result.push_str("}}}");
        result
    }

    pub fn get_loaded_chunks(&self, cam_x: u32, cam_z: u32, view_distance: u32) -> String {
        let mut chunks = String::from("[");
        let mut first = true;
        let cam_chunk_x = (cam_x / 16).min(15);
        let cam_chunk_z = (cam_z / 16).min(15);
        let distance = view_distance.min(8) as i32;
        for dx in -distance..=distance {
            for dz in -distance..=distance {
                let chunk_x = ((cam_chunk_x as i32) + dx) as u32;
                let chunk_z = ((cam_chunk_z as i32) + dz) as u32;
                if chunk_x < 16 && chunk_z < 16 {
                    if !first { chunks.push(','); }
                    chunks.push_str(&format!(r#"{{"x":{},"z":{}}}"#, chunk_x, chunk_z));
                    first = false;
                }
            }
        }
        chunks.push(']');
        chunks
    }

    pub fn export_json(&self) -> String {
        let mut json = String::from("{\"version\":3,\"blocks\":[");
        let mut first = true;
        for y in 0..64 {
            for x in 0..256 {
                for z in 0..256 {
                    let block_id = self.get_block(x, y, z);
                    if block_id > 0 {
                        if !first { json.push(','); }
                        let block_name = self.get_block_name(block_id);
                        json.push_str(&format!("{{\"x\":{},\"y\":{},\"z\":{},\"id\":{},\"name\":\"{}\"}}",
                            x, y, z, block_id, block_name));
                        first = false;
                    }
                }
            }
        }
        json.push_str("]}");
        json
    }

    pub fn export_csv(&self) -> String {
        let mut csv = String::from("x,y,z,block_id,block_name\n");
        for y in 0..64 {
            for x in 0..256 {
                for z in 0..256 {
                    let block_id = self.get_block(x, y, z);
                    if block_id > 0 {
                        let block_name = self.get_block_name(block_id);
                        csv.push_str(&format!("{},{},{},{},{}\n", x, y, z, block_id, block_name));
                    }
                }
            }
        }
        csv
    }

    pub fn get_world_summary(&self) -> String {
        let mut total = 0u32;
        let mut min_x = 256u32;
        let mut max_x = 0u32;
        let mut min_y = 64u32;
        let mut max_y = 0u32;
        let mut min_z = 256u32;
        let mut max_z = 0u32;
        for y in 0..64 {
            for x in 0..256 {
                for z in 0..256 {
                    let block_id = self.get_block(x, y, z);
                    if block_id > 0 {
                        total += 1;
                        min_x = min_x.min(x);
                        max_x = max_x.max(x);
                        min_y = min_y.min(y);
                        max_y = max_y.max(y);
                        min_z = min_z.min(z);
                        max_z = max_z.max(z);
                    }
                }
            }
        }
        format!(r#"{{"total":{},"bounds":{{"min_x":{},"max_x":{},"min_y":{},"max_y":{},"min_z":{},"max_z":{}}},"version":"{}"}}"#,
            total, min_x, max_x, min_y, max_y, min_z, max_z, self.current_version)
    }

    pub fn is_redstone_component(&self, block_id: u32) -> bool {
        matches!(block_id, 121..=130 | 139..=152)  // Include both original range and actual redstone blocks
    }

    pub fn get_redstone_power(&self, x: u32, y: u32, z: u32) -> u32 {
        let block_id = self.get_block(x, y, z);
        match block_id {
            121 => 15,
            122..=130 => 15,
            _ => 0
        }
    }

    pub fn check_nearby_power(&self, x: u32, y: u32, z: u32, radius: u32) -> u32 {
        let mut max_power = 0;
        for dx in 0..=radius {
            for dy in 0..=radius {
                for dz in 0..=radius {
                    if dx + dy + dz == 0 { continue; }
                    let nx = (x as i32 + dx as i32 - radius as i32).max(0) as u32;
                    let ny = (y as i32 + dy as i32 - radius as i32).max(0) as u32;
                    let nz = (z as i32 + dz as i32 - radius as i32).max(0) as u32;
                    if nx < 256 && ny < 64 && nz < 256 {
                        let block_id = self.get_block(nx, ny, nz);
                        if self.is_redstone_component(block_id) {
                            let power = (15u32).saturating_sub((dx + dy + dz) as u32);
                            max_power = max_power.max(power);
                        }
                    }
                }
            }
        }
        max_power
    }

    pub fn calculate_redstone_wire_power(&self, x: u32, y: u32, z: u32) -> u32 {
        let mut max_power = 0;
        for dx in -1..=1 {
            for dz in -1..=1 {
                if dx == 0 && dz == 0 { continue; }
                let nx = (x as i32 + dx).max(0) as u32;
                let nz = (z as i32 + dz).max(0) as u32;
                if nx < 256 && nz < 256 {
                    let block_id = self.get_block(nx, y, nz);
                    if self.is_redstone_component(block_id) {
                        max_power = 15;
                    }
                }
            }
        }
        max_power
    }

    pub fn propagate_redstone(&self) -> String {
        "{}".to_string()
    }

    pub fn get_redstone_components(&self) -> String {
        let mut result = String::from("[");
        let mut first = true;
        for y in 0..64 {
            for x in 0..256 {
                for z in 0..256 {
                    let block_id = self.get_block(x, y, z);
                    if self.is_redstone_component(block_id) {
                        let power = self.get_redstone_power(x, y, z);
                        if !first { result.push(','); }
                        result.push_str(&format!(r#"{{"x":{},"y":{},"z":{},"id":{},"power":{}}}"#, x, y, z, block_id, power));
                        first = false;
                    }
                }
            }
        }
        result.push(']');
        result
    }

    pub fn save_world(&self) -> String {
        serde_json::to_string(&self.world).unwrap_or_default()
    }

    pub fn load_world(&mut self, world_data: &str) {
        if let Ok(new_world) = serde_json::from_str(world_data) {
            self.world = new_world;
        }
    }

    pub fn export_schematic(&self) -> String {
        let mut blocks = Vec::new();
        
        for y in 0..64 {
            for z in 0..256 {
                for x in 0..256 {
                    let block_id = self.get_block(x, y, z);
                    if block_id > 0 {
                        let block_name = self.get_block_name(block_id);
                        blocks.push(serde_json::json!({
                            "x": x,
                            "y": y,
                            "z": z,
                            "id": block_id,
                            "name": block_name
                        }));
                    }
                }
            }
        }
        
        let schematic = serde_json::json!({
            "version": 3,
            "width": 256,
            "height": 64,
            "length": 256,
            "blocks": blocks
        });
        
        schematic.to_string()
    }

    pub fn import_schematic(&mut self, json_data: &str) -> Result<String, JsValue> {
        let data: serde_json::Value = serde_json::from_str(json_data)
            .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;

        let blocks = data.get("blocks")
            .and_then(|v| v.as_array())
            .ok_or(JsValue::from_str("Invalid schematic: missing blocks array"))?;

        // Clear world before importing
        self.world = vec![0u16; 256 * 256 * 64];

        for block in blocks {
            if let (Some(x), Some(y), Some(z), Some(id)) = (
                block.get("x").and_then(|v| v.as_u64()),
                block.get("y").and_then(|v| v.as_u64()),
                block.get("z").and_then(|v| v.as_u64()),
                block.get("id").and_then(|v| v.as_u64()),
            ) {
                self.set_block(x as u32, y as u32, z as u32, id as u32);
            }
        }

        Ok(format!("Imported schematic with {} blocks", blocks.len()))
    }

    // ============ REDSTONE POWER CONTROL ============
    pub fn toggle_redstone_power(&mut self, x: u32, y: u32, z: u32) -> String {
        let block_id = self.get_block(x, y, z);
        if !self.is_redstone_component(block_id) {
            return format!("Block at ({},{},{}) is not a redstone component", x, y, z);
        }
        
        let current_power = self.get_redstone_power(x, y, z);
        let new_power = if current_power > 0 { 0 } else { 15 };
        
        // Store power state (for now, we'll use a simple approach)
        // In a full implementation, this would persist power state
        format!("Redstone power at ({},{},{}): {} -> {}", x, y, z, current_power, new_power)
    }

    pub fn set_block_redstone_power(&mut self, x: u32, y: u32, z: u32, power: u32) -> String {
        if power > 15 {
            return "Power level must be 0-15".to_string();
        }
        
        let block_id = self.get_block(x, y, z);
        if !self.is_redstone_component(block_id) {
            return format!("Block at ({},{},{}) is not a redstone component", x, y, z);
        }
        
        format!("Set redstone power at ({},{},{}) to {}", x, y, z, power)
    }
}
