import * as p5 from 'p5';
import { ShapeType } from '../../interfaces/IShape';
import type IShape from '../../interfaces/IShape';
import type IRectangle from '../../interfaces/IRectangle';
import type ICircle from '../../interfaces/ICircle';
import type ITriangle from '../../interfaces/ITriangle';
import type ILine from '../../interfaces/ILine';

abstract class Shape implements IShape {
  private _offset: p5.Vector = new p5.Vector(0, 0);
  private _justCollided = false;

  abstract get width (): number;
  abstract get height (): number;
  abstract set width (width: number);
  abstract set height (height: number);

  /**
   * Useful in case we want to seperate the Shape from other shapes in a GameObject.
   * This is primarly meant to be used as an offset position to the
   * GameObject's world position.
   *
   */
  get offset (): p5.Vector {
    return this._offset;
  }

  set offset (offset: p5.Vector) {
    this._offset = offset;
  }

  get justCollided (): boolean {
    return this._justCollided;
  }

  set justCollided (justCollided: boolean) {
    this._justCollided = justCollided;
  }

  public type: ShapeType = ShapeType.rectangle;

  static countByType = (shapes: IShape[], type: ShapeType): number => {
    return shapes.filter((shape) => shape.type === type).length;
  };

  /**
 * Checks if two circles collide.
 * @returns true if the two circles collide
 */
  static circlesCollide (circle1: ICircle, position1: p5.Vector, circle2: ICircle, position2: p5.Vector): boolean {
    const distance = p5.Vector.dist(position1, position2);
    return distance < circle1.radius + circle2.radius;
  }

  /**
   * Checks if a rectangle and a circle collide.
   * @returns true if the rectangle and the circle collide
   */
  static rectCollidesWithCircle (rectangle: IRectangle, rectPos: p5.Vector, circle: ICircle, circlePos: p5.Vector): boolean {
    // Find the closest point to the circle within the rectangle
    const closestX = Math.max(rectPos.x, Math.min(circlePos.x, rectPos.x + rectangle.width));
    const closestY = Math.max(rectPos.y, Math.min(circlePos.y, rectPos.y + rectangle.height));

    // Calculate the distance between the circle's center and this closest point
    const distanceX = circlePos.x - closestX;
    const distanceY = circlePos.y - closestY;

    // If the distance is less than the circle's radius, an intersection occurs
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.radius * circle.radius);
  }

  /**
   * Checks if two rectangles collide.
   * Taking in their global positions + adding their relative offests to that position
   * to calcualte their true positions in world space.
   *
   * @returns true if the two rectangles collide
   */
  static rectsCollide = (rectangle1: IRectangle, position1: p5.Vector, rectangle2: IRectangle, position2: p5.Vector): boolean => {
    // Check if one rectangle is on the left side of the other
    if (position1.x + rectangle1.width < position2.x || position2.x + rectangle2.width < position1.x) {
      return false;
    }

    // Check if one rectangle is above the other
    if (position1.y + rectangle1.height < position2.y || position2.y + rectangle2.height < position1.y) {
      return false;
    }

    return true;
  };

  static triangleRectCollision (triangle: ITriangle, rect: IRectangle, triPos: p5.Vector, rectPos: p5.Vector): boolean {
    // Function to check if a point is inside a rectangle
    function pointInRect (point: p5.Vector, rectPos: p5.Vector, rect: IRectangle): boolean {
      return (
        point.x >= rectPos.x &&
        point.x <= rectPos.x + rect.width &&
        point.y >= rectPos.y &&
        point.y <= rectPos.y + rect.height
      );
    }

    // Function to check if a point is inside a triangle
    function pointInTriangle (pt: p5.Vector, v1: p5.Vector, v2: p5.Vector, v3: p5.Vector): boolean {
      const d1 = sign(pt, v1, v2);
      const d2 = sign(pt, v2, v3);
      const d3 = sign(pt, v3, v1);

      const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
      const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

      return !(hasNeg && hasPos);
    }

    function sign (p1: p5.Vector, p2: p5.Vector, p3: p5.Vector): number {
      return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    }

    // Check if any of the triangle's vertices are inside the rectangle
    const vertices = [triangle.vertex1, triangle.vertex2, triangle.vertex3].map(v => p5.Vector.add(v, triPos));
    for (let i = 0; i < vertices.length; i++) {
      if (pointInRect(vertices[i], rectPos, rect)) {
        return true;
      }
    }

    // Check if any of the rectangle's vertices are inside the triangle
    const rectVertices = [
      new p5.Vector(rectPos.x, rectPos.y),
      new p5.Vector(rectPos.x + rect.width, rectPos.y),
      new p5.Vector(rectPos.x + rect.width, rectPos.y + rect.height),
      new p5.Vector(rectPos.x, rectPos.y + rect.height)
    ];
    for (let i = 0; i < rectVertices.length; i++) {
      if (pointInTriangle(rectVertices[i], vertices[0], vertices[1], vertices[2])) {
        return true;
      }
    }

    return false;
  }

  static triangleTriangleCollision (triangle1: ITriangle, triangle2: ITriangle, pos1: p5.Vector, pos2: p5.Vector): boolean {
    const vertices1 = [
      p5.Vector.add(triangle1.vertex1, pos1),
      p5.Vector.add(triangle1.vertex2, pos1),
      p5.Vector.add(triangle1.vertex3, pos1)
    ];

    const vertices2 = [
      p5.Vector.add(triangle2.vertex1, pos2),
      p5.Vector.add(triangle2.vertex2, pos2),
      p5.Vector.add(triangle2.vertex3, pos2)
    ];

    const axes = Shape.getAxes(vertices1).concat(Shape.getAxes(vertices2));

    for (let i = 0; i < axes.length; i++) {
      if (!Shape.overlapOnAxis(vertices1, vertices2, axes[i])) {
        return false; // Found a separating axis
      }
    }

    return true; // No separating axis found, triangles intersect
  }

  static triangleCircleCollision (triangle: ITriangle, circle: ICircle, triPos: p5.Vector, circlePos: p5.Vector): boolean {
    // Calculate the vectors for the triangle's vertices
    const v0 = p5.Vector.add(triangle.vertex1, triPos);
    const v1 = p5.Vector.add(triangle.vertex2, triPos);
    const v2 = p5.Vector.add(triangle.vertex3, triPos);

    // Check if the circle's center is inside the triangle
    if (Shape.pointInTriangle(circlePos, v0, v1, v2)) {
      return true;
    }

    // Check if any of the triangle's vertices are inside the circle
    if (Shape.pointInCircle(v0, circlePos, circle.radius) ||
        Shape.pointInCircle(v1, circlePos, circle.radius) ||
        Shape.pointInCircle(v2, circlePos, circle.radius)) {
      return true;
    }

    // Check if the circle is close to any of the triangle's edges
    if (Shape.isCircleCloseToLine(p5.Vector.sub(v1, v0), p5.Vector.sub(circlePos, v0), circle.radius) ||
        Shape.isCircleCloseToLine(p5.Vector.sub(v2, v1), p5.Vector.sub(circlePos, v1), circle.radius) ||
        Shape.isCircleCloseToLine(p5.Vector.sub(v0, v2), p5.Vector.sub(circlePos, v2), circle.radius)) {
      return true;
    }

    return false;
  }

  static lineIntersectsTriangle (triangle: ITriangle, line: ILine, triPos: p5.Vector, linePos: p5.Vector): boolean {
    // Adjust vertices of the triangle and line endpoints according to their positions
    const tri = {
      vertex1: p5.Vector.add(triangle.vertex1, triPos),
      vertex2: p5.Vector.add(triangle.vertex2, triPos),
      vertex3: p5.Vector.add(triangle.vertex3, triPos)
    };

    const ln = {
      vertex1: p5.Vector.add(line.vertex1, linePos),
      vertex2: p5.Vector.add(line.vertex2, linePos)
    };

    // Simplified function to check if two line segments intersect
    function segmentsIntersect (a1: p5.Vector, a2: p5.Vector, b1: p5.Vector, b2: p5.Vector): boolean {
      function cross (v1: p5.Vector, v2: p5.Vector): number {
        return v1.x * v2.y - v1.y * v2.x;
      }

      const d1 = cross(p5.Vector.sub(a2, a1), p5.Vector.sub(b1, a1));
      const d2 = cross(p5.Vector.sub(a2, a1), p5.Vector.sub(b2, a1));
      const d3 = cross(p5.Vector.sub(b2, b1), p5.Vector.sub(a1, b1));
      const d4 = cross(p5.Vector.sub(b2, b1), p5.Vector.sub(a2, b1));

      if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
      }

      return false;
    }

    // Check if line intersects with any of the triangle's edges
    if (segmentsIntersect(tri.vertex1, tri.vertex2, ln.vertex1, ln.vertex2) ||
        segmentsIntersect(tri.vertex2, tri.vertex3, ln.vertex1, ln.vertex2) ||
        segmentsIntersect(tri.vertex3, tri.vertex1, ln.vertex1, ln.vertex2)) {
      return true;
    }

    return false;
  }

  /**
 * Helper method to check if a point is inside a triangle.
 * @param pt The point to check.
 * @param v1 Vertex 1 of the triangle.
 * @param v2 Vertex 2 of the triangle.
 * @param v3 Vertex 3 of the triangle.
 * @returns true if the point is inside the triangle, false otherwise.
 */
  static pointInTriangle (pt: p5.Vector, v1: p5.Vector, v2: p5.Vector, v3: p5.Vector): boolean {
  // Calculate the areas and their signs
    const d1 = this.sign(pt, v1, v2);
    const d2 = this.sign(pt, v2, v3);
    const d3 = this.sign(pt, v3, v1);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    // The point is inside the triangle if it's on the same side of all edges
    return !(hasNeg && hasPos);
  }

  /**
 * Helper function to compute the sign of an area formed by three points.
 * @param p1 First point.
 * @param p2 Second point.
 * @param p3 Third point.
 * @returns The sign of the area.
 */
  static sign (p1: p5.Vector, p2: p5.Vector, p3: p5.Vector): number {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }

  // Helper method to check if a point is inside a circle
  static pointInCircle (point: p5.Vector, circleCenter: p5.Vector, radius: number): boolean {
    return p5.Vector.dist(point, circleCenter) < radius;
  }

  // Helper method to check if a circle is close to a line segment
  static isCircleCloseToLine (lineVec: p5.Vector, vecToCircleCenter: p5.Vector, radius: number): boolean {
    const lineLength = lineVec.mag();
    const dot = (vecToCircleCenter.x * lineVec.x + vecToCircleCenter.y * lineVec.y) / lineLength;
    const closestPoint = dot < 0 ? 0 : (dot > lineLength ? lineLength : dot);
    const closestVec = p5.Vector.add(vecToCircleCenter, lineVec.setMag(closestPoint));
    return closestVec.mag() < radius;
  }

  static getAxes (vertices: p5.Vector[]): p5.Vector[] {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      const edge = p5.Vector.sub(p2, p1);
      const normal = new p5.Vector(-edge.y, edge.x);
      axes.push(normal.normalize());
    }
    return axes;
  }

  static overlapOnAxis (vertices1: p5.Vector[], vertices2: p5.Vector[], axis: p5.Vector): boolean {
    const [min1, max1] = Shape.projectVertices(vertices1, axis);
    const [min2, max2] = Shape.projectVertices(vertices2, axis);

    return min1 <= max2 && min2 <= max1;
  }

  static projectVertices (vertices: p5.Vector[], axis: p5.Vector): [number, number] {
    let min = p5.Vector.dot(axis, vertices[0]);
    let max = min;
    for (let i = 1; i < vertices.length; i++) {
      const projection = p5.Vector.dot(axis, vertices[i]);
      if (projection < min) min = projection;
      if (projection > max) max = projection;
    }
    return [min, max];
  }

  /**
   * Checks if two shapes collide, accounting for their positions.
   * @returns true if the two shapes collide
   */
  static collide = (shape1: IShape, position1: p5.Vector, shape2: IShape, position2: p5.Vector): boolean => {
    // NOTE: very annoying but shapes have offests that position doesn't account for:
    // this is because many shapes can be drawn by one drawBehavior so it's helpful to be able to
    // position them relative to their world position.
    position1 = new p5.Vector(position1.x + shape1.offset.x, position1.y + shape1.offset.y);
    position2 = new p5.Vector(position2.x + shape2.offset.x, position2.y + shape2.offset.y);

    const rectCount = Shape.countByType([shape1, shape2], ShapeType.rectangle);
    const circleCount = Shape.countByType([shape1, shape2], ShapeType.circle);
    const triangleCount = Shape.countByType([shape1, shape2], ShapeType.triangle);

    // const polygonCount = Shape.countByType([shape1, shape2], ShapeType.polygon);

    if (rectCount === 2) {
      return Shape.rectsCollide(shape1 as unknown as IRectangle, position1, shape2 as unknown as IRectangle, position2);
    }

    if (circleCount === 2) {
      return Shape.circlesCollide(shape1 as unknown as ICircle, position1, shape2 as unknown as ICircle, position2);
    }

    if (triangleCount === 2) {
      return Shape.triangleTriangleCollision(shape1 as unknown as ITriangle, shape2 as unknown as ITriangle, position1, position2);
    }

    if (rectCount === 1 && circleCount === 1) {
      const isShape1Rect = shape1.type === ShapeType.rectangle;
      const rect = isShape1Rect ? shape1 as unknown as IRectangle : shape2 as unknown as IRectangle;
      const circle = isShape1Rect ? shape2 as unknown as ICircle : shape1 as unknown as ICircle;
      const rectPos = isShape1Rect ? position1 : position2;
      const circlePos = isShape1Rect ? position2 : position1;

      return Shape.rectCollidesWithCircle(rect, rectPos, circle, circlePos);
    }

    // TODO: change these to match the pattern above. Or change the pattern above to match this pattern:

    // Handle triangle-rectangle collision
    if (shape1.type === ShapeType.triangle && shape2.type === ShapeType.rectangle) {
      return Shape.triangleRectCollision(shape1 as unknown as ITriangle, shape2 as unknown as IRectangle, position1, position2);
    } else if (shape2.type === ShapeType.triangle && shape1.type === ShapeType.rectangle) {
      return Shape.triangleRectCollision(shape2 as unknown as ITriangle, shape1 as unknown as IRectangle, position2, position1);
    }

    // Handle triangle-circle collision
    if (shape1.type === ShapeType.triangle && shape2.type === ShapeType.circle) {
      return Shape.triangleCircleCollision(shape1 as unknown as ITriangle, shape2 as unknown as ICircle, position1, position2);
    } else if (shape2.type === ShapeType.triangle && shape1.type === ShapeType.circle) {
      return Shape.triangleCircleCollision(shape2 as unknown as ITriangle, shape1 as unknown as ICircle, position2, position1);
    }

    if (shape1.type === ShapeType.triangle && shape2.type === ShapeType.line) {
      return Shape.lineIntersectsTriangle(shape1 as unknown as ITriangle, shape2 as unknown as ILine, position1, position2);
    } else if (shape2.type === ShapeType.triangle && shape1.type === ShapeType.line) {
      return Shape.lineIntersectsTriangle(shape2 as unknown as ITriangle, shape1 as unknown as ILine, position2, position1);
    }

    return false;
  };
}

export default Shape;
